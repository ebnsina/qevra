<script lang="ts">
	// One headline number on a dashboard. Its digits count up the first time it scrolls into view.
	import type { Home01Icon } from '@hugeicons/core-free-icons';
	import Icon from '../../ui/Icon.svelte';
	import { inView } from '../../ui/in-view.js';
	import RollingNumber from '../../ui/RollingNumber.svelte';

	interface Props {
		label: string;
		/** Already formatted ("1,204", "৳2,500", "৯৫%"): its digits roll, the rest stays put. */
		value: string;
		/** One quiet line under the number: a comparison, a note. */
		hint?: string;
		icon?: typeof Home01Icon;
		/** Locale of the digits in `value`, when they aren't 0-9. */
		locales?: Intl.LocalesArgument;
	}
	let { label, value, hint, icon, locales }: Props = $props();

	// Each script's own zero (Latin, Arabic-Indic, Persian, Devanagari, Bangla), to count up from.
	const ZEROS = [0x30, 0x660, 0x6f0, 0x966, 0x9e6];
	const zeroed = (text: string) =>
		text.replace(/\p{Nd}/gu, (digit) => {
			const code = digit.codePointAt(0)!;
			const zero = ZEROS.find((z) => code >= z && code <= z + 9);
			return zero === undefined ? digit : String.fromCodePoint(zero);
		});

	let seen = $state(false);
	// One frame after it appears, so RollingNumber has drawn its zeros to roll from.
	const start = () => requestAnimationFrame(() => (seen = true));
	const shown = $derived(seen ? value : zeroed(value));
</script>

<div class="stat" {@attach inView(start, { threshold: 0.4 })}>
	<div class="top">
		<span class="label">{label}</span>
		{#if icon}<span class="icon"><Icon {icon} size={16} /></span>{/if}
	</div>
	<!-- Screen readers get the real value at once, not the zeros it rolls from. -->
	<span class="value" aria-label={value}
		><RollingNumber value={shown} {locales} duration={900} /></span
	>
	{#if hint}<span class="hint">{hint}</span>{/if}
</div>

<style>
	.stat {
		display: grid;
		align-content: start;
		gap: 0.375rem;
		padding: 1rem 1.125rem;
		border: 1px solid var(--ui-card-line, var(--ui-field-line));
		border-radius: var(--ui-radius);
		background: var(--ui-surface);
		box-shadow: var(--ui-card-shadow, none);
		color: var(--ui-fg);
		font-family: var(--ui-font);
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.label {
		padding-block-start: 0.25rem;
		color: var(--ui-muted);
		font-size: 0.875rem;
	}
	.icon {
		display: grid;
		flex: none;
		place-items: center;
		inline-size: 2rem;
		block-size: 2rem;
		border-radius: var(--ui-radius-control);
		/* Set these two to color the tile: a different hue per stat tells a row of them apart. */
		background: var(--ui-stat-icon-bg, var(--ui-subtle));
		color: var(--ui-stat-icon-fg, var(--ui-fg));
	}
	.value {
		font-size: 1.625rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
	}
	.hint {
		color: var(--ui-muted);
		font-size: 0.8125rem;
	}
</style>
