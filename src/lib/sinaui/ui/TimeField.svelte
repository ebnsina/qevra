<script lang="ts">
	import { Clock01Icon } from '@hugeicons/core-free-icons';
	import { Time } from '@internationalized/date';
	import { tick, untrack } from 'svelte';
	import { anchored } from './floating';
	import { scrollEdges } from './scroll-edges';
	import Icon from './Icon.svelte';

	type Kind = 'hour' | 'minute' | 'second' | 'dayPeriod';

	interface Props {
		label: string;
		value?: Time;
		/** Fixed, so server and browser render the same; decides 12 or 24 hours and the order. */
		locale?: string;
		/** Show seconds too. */
		granularity?: 'minute' | 'second';
		/** Overrides the locale's clock. */
		hourCycle?: 12 | 24;
		/** Up and Down move the minutes by this much. */
		minuteStep?: number;
		/** Minutes between the times in the list the clock button opens (30, or minuteStep if larger). */
		listStep?: number;
		/** The start of a range this field ends: the list begins after it and shows each option's length. */
		from?: Time;
		/** Just the parts, for a field that holds several (TimeRangeField): no box, visible label or button. */
		bare?: boolean;
		/** With bare: ids of the text that describes the whole field. */
		describedBy?: string;
		/** Called after a time is chosen from the list (a range moves on to its end). */
		onpick?: () => void;
		hint?: string;
		error?: string;
		/** Form field name: a hidden input carries the time as HH:MM (or HH:MM:SS). */
		name?: string;
		disabled?: boolean;
	}

	let {
		label,
		value = $bindable(),
		locale = 'en',
		granularity = 'minute',
		hourCycle,
		minuteStep = 1,
		listStep,
		from,
		bare = false,
		describedBy,
		onpick,
		hint,
		error,
		name,
		disabled = false
	}: Props = $props();

	const id = $props.id();
	const seconds = $derived(granularity === 'second');

	// Everything about the clock comes from Intl: 12 or 24 hours, part order, separators, AM/PM words.
	const fmt = $derived(
		new Intl.DateTimeFormat(locale, {
			hour: 'numeric',
			minute: '2-digit',
			second: seconds ? '2-digit' : undefined,
			hourCycle: hourCycle === 12 ? 'h12' : hourCycle === 24 ? 'h23' : undefined
		})
	);
	const is12 = $derived(['h11', 'h12'].includes(fmt.resolvedOptions().hourCycle ?? ''));
	const sample = $derived(fmt.formatToParts(new Date(2000, 0, 1, 9, 5, 7)));
	const parts = $derived(
		sample.filter(
			(p) => p.type === 'literal' || ['hour', 'minute', 'second', 'dayPeriod'].includes(p.type)
		)
	);
	const kinds = $derived(parts.filter((p) => p.type !== 'literal').map((p) => p.type as Kind));
	const periods = $derived(
		[9, 21].map(
			(h) =>
				fmt.formatToParts(new Date(2000, 0, 1, h)).find((p) => p.type === 'dayPeriod')?.value ?? ''
		)
	);
	const hourPad = $derived(sample.find((p) => p.type === 'hour')?.value.length === 2);
	const pad2 = $derived(
		new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })
	);
	const pad1 = $derived(new Intl.NumberFormat(locale, { useGrouping: false }));
	// The locale's own digits (٠١٢…) are accepted as typed, as well as 0–9.
	const localDigits = $derived(Array.from({ length: 10 }, (_, i) => pad1.format(i)));
	const names = $derived.by(() => {
		const dn = new Intl.DisplayNames(locale, { type: 'dateTimeField' });
		return {
			hour: dn.of('hour') ?? 'hour',
			minute: dn.of('minute') ?? 'minute',
			second: dn.of('second') ?? 'second',
			dayPeriod: dn.of('dayPeriod') ?? 'AM/PM'
		};
	});

	const range = (k: Kind): [number, number] =>
		k === 'hour' ? (is12 ? [1, 12] : [0, 23]) : k === 'dayPeriod' ? [0, 1] : [0, 59];

	// Each part on its own: a half-typed time keeps what's there, and value is set once it's whole.
	let seg = $state<Partial<Record<Kind, number>>>({});
	const composed = $derived.by(() => {
		const { hour, minute, second, dayPeriod } = seg;
		if (hour === undefined || minute === undefined) return undefined;
		if ((seconds && second === undefined) || (is12 && dayPeriod === undefined)) return undefined;
		return new Time(is12 ? (hour % 12) + (dayPeriod ? 12 : 0) : hour, minute, seconds ? second : 0);
	});

	function fill(t: Time) {
		seg = {
			hour: is12 ? t.hour % 12 || 12 : t.hour,
			minute: t.minute,
			second: t.second,
			dayPeriod: t.hour >= 12 ? 1 : 0
		};
	}
	// Set from outside (or reset): the parts follow.
	$effect(() => {
		const v = value;
		untrack(() => {
			if (v && (!composed || v.compare(composed) !== 0)) fill(v);
			else if (!v && composed) seg = {};
		});
	});

	function set(k: Kind, n: number | undefined) {
		seg[k] = n;
		const c = composed;
		if (!(c && value && c.compare(value) === 0)) value = c;
	}

	let els = $state<HTMLElement[]>([]);
	// Digits typed so far into the focused part; starts fresh whenever focus moves.
	let typed = '';
	const focusAt = (i: number) => els[Math.max(0, Math.min(kinds.length - 1, i))]?.focus();

	function step(k: Kind, by: number) {
		const [lo, hi] = range(k);
		const cur = seg[k];
		if (cur === undefined) {
			// Empty: start from now, so the first press lands somewhere sensible.
			const now = new Date();
			const h = now.getHours();
			const start = {
				hour: is12 ? h % 12 || 12 : h,
				minute: (Math.round(now.getMinutes() / minuteStep) * minuteStep) % 60,
				second: now.getSeconds(),
				dayPeriod: h >= 12 ? 1 : 0
			}[k];
			return set(k, start);
		}
		const span = hi - lo + 1;
		// Minutes on a step snap to it first (10:07 up by 15 is 10:15).
		const base =
			k === 'minute' && minuteStep > 1 && by !== 0
				? Math.floor(cur / minuteStep) * minuteStep
				: cur;
		const next = base === cur ? cur + by : by > 0 ? base + by : base;
		set(k, ((((next - lo) % span) + span) % span) + lo);
	}

	function erase(i: number) {
		const k = kinds[i];
		if (seg[k] === undefined) return focusAt(i - 1);
		typed = k === 'dayPeriod' ? '' : String(seg[k]).slice(0, -1);
		set(k, typed ? Number(typed) : undefined);
	}

	function onkeydown(e: KeyboardEvent, i: number) {
		const k = kinds[i];
		const rtl = getComputedStyle(e.currentTarget as Element).direction === 'rtl';
		const unit = k === 'minute' ? minuteStep : 1;
		const big = k === 'hour' ? 2 : k === 'dayPeriod' ? 1 : 15;
		const keys: Record<string, () => void> = {
			ArrowUp: () => step(k, unit),
			// Alt+Down opens the list, as on any field with one.
			ArrowDown: () => (e.altKey ? show() : step(k, -unit)),
			PageUp: () => step(k, big),
			PageDown: () => step(k, -big),
			Home: () => set(k, range(k)[0]),
			End: () => set(k, range(k)[1]),
			ArrowLeft: () => focusAt(i + (rtl ? 1 : -1)),
			ArrowRight: () => focusAt(i + (rtl ? -1 : 1)),
			// Here, not only in beforeinput: Safari sends none when there's nothing before the caret.
			Backspace: () => erase(i),
			Delete: () => erase(i)
		};
		const act = keys[e.key];
		if (!act || disabled) return;
		e.preventDefault();
		act();
	}

	// All typing arrives here (keyboards, phones, IMEs); the text itself is always ours.
	function onbeforeinput(e: InputEvent, i: number) {
		e.preventDefault();
		if (disabled) return;
		const k = kinds[i];
		if (e.inputType.startsWith('delete')) return erase(i);
		const ch = e.data?.slice(-1);
		if (!ch) return;
		if (k === 'dayPeriod') {
			const p = periods.findIndex((w) => w.toLowerCase().startsWith(ch.toLowerCase()));
			if (p >= 0) set(k, p);
			else if (/[ap]/i.test(ch)) set(k, /a/i.test(ch) ? 0 : 1);
			return;
		}
		const d = /\d/.test(ch) ? Number(ch) : localDigits.indexOf(ch);
		if (d < 0) {
			// A separator moves on, as it would in a plain text box.
			if (/[\s:.,]/.test(ch) && seg[k] !== undefined) focusAt(i + 1);
			return;
		}
		const [lo, hi] = range(k);
		let s = typed + d;
		if (Number(s) > hi) s = String(d);
		typed = s;
		const n = Number(s);
		set(k, n >= lo ? n : undefined);
		// No digit could follow (3 in the hour, or two typed): on to the next part.
		if (n * 10 > hi || s.length >= 2) focusAt(i + 1);
	}

	const shown = (k: Kind) => {
		const v = seg[k];
		if (v === undefined) return '––';
		if (k === 'dayPeriod') return periods[v];
		return (k === 'hour' && !hourPad ? pad1 : pad2).format(v);
	};
	const spoken = (k: Kind) => {
		const v = seg[k];
		return v === undefined ? 'Empty' : k === 'dayPeriod' ? periods[v] : pad1.format(v);
	};

	// The list: every listStep minutes through the day, written the locale's way.
	let control = $state<HTMLDivElement>()!;
	let list = $state<HTMLDivElement>();
	let open = $state(false);
	const stepMins = $derived(listStep ?? (minuteStep > 1 ? minuteStep : 30));
	const listFmt = $derived(
		new Intl.DateTimeFormat(locale, {
			hour: 'numeric',
			minute: '2-digit',
			hourCycle: is12 ? 'h12' : 'h23'
		})
	);
	// "8 hr, 45 min", written by Intl; the fallback builds the same from unit formats.
	const lengthOf = $derived.by(() => {
		const DF = (
			Intl as unknown as {
				DurationFormat?: new (l: string, o: object) => { format(d: object): string };
			}
		).DurationFormat;
		if (DF) {
			const df = new DF(locale, { style: 'short' });
			return (m: number) => df.format({ hours: Math.floor(m / 60), minutes: m % 60 });
		}
		const unit = (u: string) =>
			new Intl.NumberFormat(locale, { style: 'unit', unit: u, unitDisplay: 'short' });
		const h = unit('hour');
		const mi = unit('minute');
		return (m: number) =>
			[m >= 60 && h.format(Math.floor(m / 60)), m % 60 && mi.format(m % 60)]
				.filter(Boolean)
				.join(', ');
	});
	const slots = $derived.by(() => {
		// After a start time, the list runs from just after it to the end of the day.
		const begin = from ? from.hour * 60 + from.minute + stepMins : 0;
		const all = [];
		for (let m = begin; m < 1440; m += stepMins) {
			const t = new Time(Math.floor(m / 60), m % 60);
			const span = from ? m - begin + stepMins : 0;
			all.push({
				t,
				text: listFmt.format(new Date(2000, 0, 1, t.hour, t.minute)),
				length: from ? lengthOf(span) : ''
			});
		}
		return all;
	});
	const mins = (t: Time) => t.hour * 60 + t.minute;

	const float = anchored(
		() => control,
		() => list!,
		// An outside press closes it the same way as Escape, so the popup hides with its list.
		() => hide(false),
		{ side: 'bottom', align: 'start', gap: 6 }
	);
	$effect(() => () => float.destroy());

	/** Opens the list of times (the range's single clock button calls this on the half last used). */
	export async function show() {
		if (disabled) return;
		open = true;
		await tick();
		if (!list) return;
		list.style.minInlineSize = `${control.offsetWidth}px`;
		float.open();
		// Opens on the chosen time, or the next slot after it (or after now).
		const at = value ? mins(value) : new Date().getHours() * 60 + new Date().getMinutes();
		const i = Math.max(
			0,
			slots.findIndex((s) => mins(s.t) >= at)
		);
		const el = list.children[i === -1 ? 0 : i] as HTMLElement | undefined;
		el?.scrollIntoView({ block: 'center' });
		el?.focus({ preventScroll: true });
	}
	function hide(refocus = true) {
		open = false;
		float.close();
		if (refocus) els[0]?.focus();
	}
	function pick(t: Time) {
		fill(t);
		const c = composed;
		if (!(c && value && c.compare(value) === 0)) value = c;
		hide();
		onpick?.();
	}
	function onlistkey(e: KeyboardEvent) {
		const opts = [...list!.children] as HTMLElement[];
		const i = opts.indexOf(document.activeElement as HTMLElement);
		const to: Record<string, number> = {
			ArrowDown: i + 1,
			ArrowUp: i - 1,
			PageDown: i + 4,
			PageUp: i - 4,
			Home: 0,
			End: opts.length - 1
		};
		if (e.key in to) {
			e.preventDefault();
			opts[Math.max(0, Math.min(opts.length - 1, to[e.key]))].focus();
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(slots[i].t);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			hide();
		} else if (e.key === 'Tab') hide(false);
	}

	const describedby = $derived(
		bare
			? describedBy
			: [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
	);
</script>

<div class="field">
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<span
		id="{id}-label"
		class={['label', bare && 'sr-only']}
		onclick={() => focusAt(kinds.findIndex((k) => seg[k] === undefined))}>{label}</span
	>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={control}
		class={['control', bare && 'bare', disabled && 'disabled']}
		role="group"
		aria-labelledby="{id}-label"
		aria-describedby={describedby}
		data-invalid={error ? true : undefined}
		onclick={(e) => {
			// Clicking the box, not a part: the first empty part, or the last.
			if (e.target !== e.currentTarget) return;
			const empty = kinds.findIndex((k) => seg[k] === undefined);
			focusAt(empty < 0 ? kinds.length - 1 : empty);
		}}
	>
		{#each parts as p, pi (pi)}
			{#if p.type === 'literal'}
				<span class="literal" aria-hidden="true">{p.value}</span>
			{:else}
				{@const k = p.type as Kind}
				{@const i = kinds.indexOf(k)}
				{@const [lo, hi] = range(k)}
				<span
					bind:this={els[i]}
					id="{id}-{k}"
					class={['segment', k, seg[k] === undefined && 'empty']}
					role="spinbutton"
					tabindex={disabled ? undefined : 0}
					contenteditable={!disabled}
					inputmode={k === 'dayPeriod' ? 'text' : 'numeric'}
					enterkeyhint={i === kinds.length - 1 ? 'done' : 'next'}
					spellcheck="false"
					autocapitalize="off"
					aria-label={names[k]}
					aria-labelledby="{id}-label {id}-{k}"
					aria-describedby={describedby}
					aria-valuemin={lo}
					aria-valuemax={hi}
					aria-valuenow={seg[k]}
					aria-valuetext={spoken(k)}
					aria-invalid={error ? true : undefined}
					aria-disabled={disabled || undefined}
					onfocus={(e) => {
						typed = '';
						// Caret at the end, so a phone's delete key always has something to delete.
						getSelection()?.selectAllChildren(e.currentTarget);
						getSelection()?.collapseToEnd();
					}}
					onkeydown={(e) => onkeydown(e, i)}
					onbeforeinput={(e) => onbeforeinput(e, i)}><span class="value">{shown(k)}</span></span
				>
			{/if}
		{/each}
		<!-- Out of the tab order: the parts are the field; Alt+Down opens the list from any of them. -->
		{#if !bare}<button
				type="button"
				class="clock"
				tabindex="-1"
				aria-label="Choose a time"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls="{id}-list"
				aria-keyshortcuts="Alt+ArrowDown"
				{disabled}
				onclick={() => (open ? hide() : show())}
			>
				<Icon icon={Clock01Icon} size={16} />
			</button>{/if}
	</div>
	<div
		bind:this={list}
		id="{id}-list"
		class="list"
		popover="manual"
		{@attach scrollEdges}
		data-fade-over
		role="listbox"
		aria-label={label}
		tabindex="-1"
		onkeydown={onlistkey}
	>
		<!-- Always rendered: removing them on close would empty the popup mid close-animation. -->
		{#each slots as s (s.text)}
			{@const chosen = !!value && mins(value) === mins(s.t)}
			<div
				class="option"
				role="option"
				tabindex="-1"
				aria-selected={chosen}
				onclick={() => pick(s.t)}
				onkeydown={() => {}}
			>
				{s.text}{#if s.length}<span class="length">({s.length})</span>{/if}
			</div>
		{/each}
	</div>
	{#if name}<input
			type="hidden"
			{name}
			value={value?.toString().slice(0, seconds ? 8 : 5) ?? ''}
		/>{/if}
	{#if hint && !bare}<p id="{id}-hint" class="hint">{hint}</p>{/if}
	{#if error && !bare}<p id="{id}-error" class="error">{error}</p>{/if}
</div>

<style>
	.field {
		display: grid;
		/* Label stays tight when a neighbor is taller. */
		align-content: start;
		gap: 0.25rem;
		font: var(--ui-font-size)/1.5 var(--ui-font);
		color: var(--ui-fg);
	}
	.label {
		font-weight: 500;
		cursor: default;
	}
	.label.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.length {
		margin-inline-start: 0.5rem;
		color: var(--ui-muted);
		font-weight: 400;
	}
	/* Same box as Input, stretching with its field; the clock sits at the end. */
	.control {
		display: flex;
		align-items: center;
		box-sizing: border-box;
		min-block-size: var(--ui-control-h);
		/* Less block padding than Input: the 28px clock button would otherwise make it 42px. */
		padding: 0.25rem 0.625rem;
		border: 1px solid var(--ui-field-line);
		border-radius: var(--ui-radius-control);
		background: var(--ui-surface);
		font-size: var(--ui-control-font);
		font-variant-numeric: tabular-nums;
		cursor: text;
	}
	@media (pointer: coarse) {
		.control {
			min-block-size: var(--ui-control-h-touch);
		}
	}
	/* Inside another field's box: only the parts, sized to themselves. */
	.control.bare {
		display: inline-flex;
		min-block-size: 0;
		padding: 0;
		border: 0;
		background: none;
		outline: none;
	}
	.field:has(> .bare) {
		display: contents;
	}
	.control:not(.bare):focus-within {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	.control[data-invalid] {
		border-color: var(--ui-danger);
		outline-color: var(--ui-danger);
	}
	.disabled {
		background: var(--ui-subtle);
		opacity: 0.55;
		cursor: not-allowed;
	}
	/* Each part keeps room for two digits (no shift from 9 to 10); the highlight hugs the digits. */
	.segment {
		box-sizing: content-box;
		min-inline-size: max(2ch, 1.5rem);
		outline: none;
		/* The text is ours; a blinking caret in it would only confuse. */
		caret-color: transparent;
		text-align: center;
		white-space: nowrap;
	}
	.value {
		padding: 0.0625rem 0.1875rem;
		border-radius: calc(var(--ui-radius-control) * 0.5);
	}
	/* An unpadded hour ("8") sits against the colon, not centered in a two-digit slot. */
	.hour {
		text-align: end;
	}
	.clock {
		display: grid;
		place-items: center;
		inline-size: 1.75rem;
		block-size: 1.75rem;
		margin-block: 0;
		margin-inline: auto -0.25rem;
		padding: 0;
		border: 0;
		border-radius: calc(var(--ui-radius) * 0.75);
		background: none;
		color: var(--ui-muted);
		cursor: pointer;
		transition:
			background-color var(--ui-dur-press) ease,
			color var(--ui-dur-press) ease,
			transform var(--ui-dur-press) var(--ui-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.clock:hover {
			background: var(--ui-subtle);
			color: var(--ui-fg);
		}
	}
	.clock:active {
		transform: scale(0.92);
	}
	.clock[aria-expanded='true'] {
		color: var(--ui-fg);
	}
	.list {
		position: fixed;
		inset: auto;
		box-sizing: border-box;
		max-block-size: min(16rem, calc(100dvh - 16px));
		margin: 0;
		padding: 0.25rem;
		overflow: auto;
		overscroll-behavior: contain;
		border: 1px solid transparent;
		border-radius: var(--ui-radius);
		background: var(--ui-surface-overlay);
		color: var(--ui-fg);
		font: 0.875rem/1.4 var(--ui-font);
		font-variant-numeric: tabular-nums;
		box-shadow: var(--ui-shadow-overlay);
		scrollbar-width: thin;
	}
	.option {
		display: flex;
		align-items: center;
		min-block-size: 2rem;
		padding: 0 0.625rem;
		border-radius: calc(var(--ui-radius) - 0.25rem);
		outline: none;
		white-space: nowrap;
		cursor: pointer;
		transition: background-color 80ms ease;
	}
	@media (pointer: coarse) {
		.option {
			min-block-size: 2.75rem;
		}
	}
	.option:hover,
	.option:focus {
		background: var(--ui-subtle);
	}
	.option[aria-selected='true'] {
		background: color-mix(in srgb, var(--ui-accent) 14%, transparent);
		color: color-mix(in srgb, var(--ui-accent) 80%, var(--ui-fg));
		font-weight: 600;
	}
	.option[aria-selected='true']:focus {
		background: color-mix(in srgb, var(--ui-accent) 22%, transparent);
	}
	.dayPeriod {
		margin-inline-start: 0.25rem;
	}
	.empty {
		color: var(--ui-muted);
	}
	/* The part being typed into is filled, so it's plain where the digits go. */
	.segment:focus .value {
		background: var(--ui-accent);
		color: var(--ui-on-accent);
	}
	.literal {
		color: var(--ui-muted);
		white-space: pre;
	}
	.hint,
	.error {
		margin: 0;
		font-size: 0.8125rem;
	}
	.hint {
		color: var(--ui-muted);
	}
	.error {
		color: var(--ui-danger);
	}
	@media (forced-colors: active) {
		.segment:focus .value {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
		}
	}
</style>
