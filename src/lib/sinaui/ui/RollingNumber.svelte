<script lang="ts">
	import { onMount, untrack } from 'svelte';

	interface Props {
		/** A number, or text you've already formatted ("18px", "40 days"): its digits roll either way. */
		value: number | string;
		/** Intl.NumberFormat options for a number value: percent, currency, units, decimals. */
		format?: Intl.NumberFormatOptions;
		locales?: Intl.LocalesArgument;
		/** The longest a roll takes, in ms; quicker changes roll quicker still. */
		duration?: number;
		class?: string;
	}

	let { value, format, locales, duration = 600, class: className }: Props = $props();

	const text = $derived(
		typeof value === 'string' ? value : new Intl.NumberFormat(locales, format).format(value)
	);
	// The locale's own digits (০–৯ for bn, ٠–٩ for ar), so numbers in any numbering system roll.
	const digits = $derived(
		[...new Intl.NumberFormat(locales, { useGrouping: false }).format(9876543210)].reverse()
	);
	const digitOf = (c: string) => {
		const i = digits.indexOf(c);
		return i >= 0 ? i : /[0-9]/.test(c) ? +c : -1;
	};
	const strip = $derived(`'${digits.join('\\A ')}'`);
	// Keyed from the right, so the ones stay the ones when 99 becomes 100 and only the new digit enters.
	// Split by grapheme, not code point: a Bangla or Arabic vowel sign must stay on its letter.
	const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
	const chars = $derived.by(() => {
		const all = [...graphemes.segment(text)].map((g) => g.segment);
		return all.map((c, i) => ({ c, key: all.length - i, digit: digitOf(c) }));
	});

	// Digits that appear later roll up from 0; the ones in the first render stay still.
	let ready = $state(false);
	onMount(() => (ready = true));

	// Always rolls, at the pace values arrive: a lone change takes the full duration, quick repeats roll
	// quicker (picking up mid-roll), and a timer's rapid ticks are near-instant rather than churning.
	let roll = $state(untrack(() => duration));
	let changedAt = -Infinity;
	let mounted = false;
	$effect.pre(() => {
		void text;
		// The first value isn't a change: the first real change (a count-up on load) rolls in full.
		if (!mounted) return void (mounted = true);
		const now = performance.now();
		const gap = now - changedAt;
		roll = gap < 120 ? 0 : Math.min(duration, Math.round(gap * 0.8));
		changedAt = now;
	});
</script>

<!-- Every visible character is CSS generated content, so the only real text is the value itself:
     copying, find-in-page and screen readers all get "1–8", never the digit strips. -->
<span class={['rolling', ready && 'ready', className]} style:--roll="{roll}ms" style:--strip={strip}>
	<span class="sr-only">{text}</span><span class="chars" aria-hidden="true">
		{#each chars as { c, key, digit } (key)}
			{#if digit >= 0}
				<span class="digit" data-c={c}><span class="strip" style:--d={digit}></span></span>
			{:else}
				<span data-c={c}></span>
			{/if}
		{/each}
	</span>
</span>

<style>
	.rolling {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.chars {
		display: inline-flex;
	}
	.digit {
		position: relative;
		display: inline-grid;
		overflow: clip;
		/* Digits blur out at the top and bottom edges as they roll past. */
		mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent);
	}
	[data-c]::before {
		content: attr(data-c);
		/* Keep spaces ("2.5 mL", "40 days"): a lone space would otherwise collapse to nothing. */
		white-space: pre;
	}
	/* The digit's own glyph, invisible: gives it width, height and baseline. */
	.digit::before {
		visibility: hidden;
	}
	.strip {
		position: absolute;
		inset-block-start: 0;
		inset-inline: 0;
		text-align: center;
		transform: translateY(calc(var(--d) * -10%));
		transition: transform var(--roll, 600ms) var(--ui-ease-out);
	}
	.strip::before {
		content: var(--strip, '0\A 1\A 2\A 3\A 4\A 5\A 6\A 7\A 8\A 9');
		white-space: pre;
	}
	@starting-style {
		.ready .strip {
			transform: translateY(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.strip {
			transition: none;
		}
	}
	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
