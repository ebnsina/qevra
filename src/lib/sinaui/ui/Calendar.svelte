<script lang="ts" module>
	import type { CalendarDate } from '@internationalized/date';

	export interface DateRange {
		start: CalendarDate;
		end: CalendarDate;
	}
</script>

<script lang="ts">
	import { ease, reduced } from './motion';
	import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import {
		DateFormatter,
		endOfWeek,
		getLocalTimeZone,
		createCalendar,
		GregorianCalendar,
		toCalendar,
		isSameDay,
		isSameMonth,
		startOfMonth,
		startOfWeek,
		today
	} from '@internationalized/date';
	import { tick } from 'svelte';
	import { announce } from './announce';
	import type { CustomCalendar } from './calendars/bangla';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		value?: CalendarDate;
		/** Choose a start and end day instead of one: the result is in range. */
		mode?: 'single' | 'range';
		range?: DateRange;
		/** Months side by side (they wrap on narrow screens). */
		months?: number;
		/** Names the calendar for screen readers ("Loan due date"). */
		label: string;
		/** Fixed, so server and browser render the same text; drives week start and names. */
		locale?: string;
		min?: CalendarDate;
		max?: CalendarDate;
		/** Dates that can't be chosen (closed days, fully booked). */
		isUnavailable?: (date: CalendarDate) => boolean;
		/**
		 * Calendar system the days are shown in ('islamic-umalqura', 'persian', 'hebrew'...). The value
		 * stays Gregorian either way, so apps store ordinary ISO dates.
		 */
		calendar?: string | CustomCalendar;
		/** Stretch across the container (a date picker's popover) instead of hugging the days. */
		fill?: boolean;
		/** Called after a date is chosen (the value is already updated). */
		onchange?: (date: CalendarDate) => void;
		/** Called once both ends of a range are chosen. */
		onrangechange?: (range: DateRange) => void;
	}

	let {
		value = $bindable(),
		mode = 'single',
		range = $bindable(),
		months = 1,
		label,
		locale = 'en',
		min,
		max,
		isUnavailable,
		calendar = 'gregory',
		fill = false,
		onchange,
		onrangechange
	}: Props = $props();

	const id = $props.id();
	const tz = getLocalTimeZone();
	// The calendar system is fixed for the component's life, so reading it once is intended.
	// svelte-ignore state_referenced_locally
	const custom = typeof calendar === 'string' ? undefined : calendar;
	// svelte-ignore state_referenced_locally
	const system = custom?.system ?? createCalendar(calendar as Parameters<typeof createCalendar>[0]);
	// svelte-ignore state_referenced_locally
	const intlCalendar = custom ? undefined : (calendar as string);
	const shown = (d: CalendarDate) => toCalendar(d, system);
	const now = shown(today(tz));
	const clampDate = (d: CalendarDate) =>
		min && d.compare(min) < 0 ? shown(min) : max && d.compare(max) > 0 ? shown(max) : d;

	const chosen = () => {
		const d = mode === 'range' ? range?.start : value;
		return d && shown(d);
	};
	// The day with the roving tab stop; the months in view follow it.
	let focused = $state(clampDate(chosen() ?? now));
	// svelte-ignore state_referenced_locally
	let first = $state(startOfMonth(focused));
	const shownMonths = $derived(Array.from({ length: months }, (_, i) => first.add({ months: i })));
	const lastMonth = $derived(shownMonths[shownMonths.length - 1]);
	// Always six rows (the most a month can span): the calendar never changes height between months.
	const weeksOf = (m: CalendarDate) => {
		const start = startOfWeek(m, locale);
		return Array.from({ length: 6 }, (_, w) =>
			Array.from({ length: 7 }, (_, d) => start.add({ days: w * 7 + d }))
		);
	};

	// Calendars Intl knows are written by Intl; others (Bangla) bring their own names.
	const monthFormat = $derived(
		new DateFormatter(locale, { month: 'long', year: 'numeric', calendar: intlCalendar })
	);
	const nameOf = (m: CalendarDate) =>
		custom ? custom.format(m, locale, { day: false }) : monthFormat.format(m.toDate(tz));
	const monthName = $derived(shownMonths.map(nameOf).join(' – '));
	const fullDate = $derived(
		new DateFormatter(locale, {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			calendar: intlCalendar
		})
	);
	const dayName = (d: CalendarDate) =>
		custom ? custom.format(d, locale, { weekday: true }) : fullDate.format(d.toDate(tz));
	// Day numbers in the locale's digits (Arabic-Indic in Arabic, for example).
	const digits = $derived(custom ? custom.digits(locale) : new Intl.NumberFormat(locale));
	const weekdays = $derived.by(() => {
		// Narrow headers (“M”, or one Arabic letter) fit any locale; abbr gives screen readers the full name.
		const short = new DateFormatter(locale, { weekday: 'narrow' });
		const long = new DateFormatter(locale, { weekday: 'long' });
		return weeksOf(first)[0].map((d) => ({
			short: short.format(d.toDate(tz)),
			long: long.format(d.toDate(tz))
		}));
	});

	const outOfRange = (d: CalendarDate) =>
		(min && d.compare(min) < 0) || (max && d.compare(max) > 0);
	// Mid-range, days past an unavailable one can't end it: a range never spans a closed day.
	const crossesUnavailable = (d: CalendarDate) => {
		if (!anchor || !isUnavailable) return false;
		const [a, b] = d.compare(anchor) < 0 ? [d, anchor] : [anchor, d];
		for (let x = a; x.compare(b) <= 0; x = x.add({ days: 1 })) if (isUnavailable(x)) return true;
		return false;
	};
	const blocked = (d: CalendarDate) =>
		!!outOfRange(d) || !!isUnavailable?.(d) || crossesUnavailable(d);

	// Range: the first click sets the anchor; the band then follows the pointer or the tab stop.
	let anchor = $state<CalendarDate>();
	let hovered = $state<CalendarDate>();
	const ordered = (a: CalendarDate, b: CalendarDate) => (a.compare(b) <= 0 ? [a, b] : [b, a]);
	const band = $derived.by(() => {
		if (mode !== 'range') return undefined;
		if (anchor) {
			// The preview holds the last day pointed at, so crossing a gap or a closed day doesn't flicker it.
			const end = hovered ?? focused;
			return ordered(anchor, blocked(end) ? anchor : end);
		}
		return range && [shown(range.start), shown(range.end)];
	});
	const inBand = (d: CalendarDate) => !!band && d.compare(band[0]) >= 0 && d.compare(band[1]) <= 0;
	const isSelected = (d: CalendarDate) =>
		mode === 'range'
			? !!band && (isSameDay(d, band[0]) || isSameDay(d, band[1]))
			: !!value && isSameDay(d, value);

	let root: HTMLDivElement;
	// Set by keyboard moves, so focus follows the tab stop; clicks and month buttons leave focus alone.
	let moveFocus = false;

	/** Moves the tab stop; when it leaves the months in view, they page and slide in from that side. */
	function go(to: CalendarDate, withFocus: boolean) {
		const next = clampDate(to);
		focused = next;
		moveFocus = withFocus;
		const m = startOfMonth(next);
		if (m.compare(first) < 0) turn(m);
		else if (m.compare(lastMonth) > 0) turn(m.subtract({ months: months - 1 }));
	}

	/** Shows months from `to`; the month buttons page by one, the tab stop moving with them. */
	function turn(to: CalendarDate) {
		const dir = to.compare(first) > 0 ? 1 : -1;
		first = to;
		// Read after the update, so the new months are the ones said.
		tick().then(() => announce(monthName));
		slide(dir);
	}

	function page(dir: 1 | -1) {
		const to = first.add({ months: dir });
		turn(to);
		const next = clampDate(focused.add({ months: dir }));
		focused = next;
	}

	function slide(dir: 1 | -1) {
		if (reduced()) return;
		const rtl = getComputedStyle(root).direction === 'rtl' ? -1 : 1;
		for (const body of root.querySelectorAll('tbody'))
			body.animate(
				[
					{ transform: `translateX(${16 * dir * rtl}px)`, opacity: 0 },
					{ transform: 'none', opacity: 1 }
				],
				{ duration: 220, easing: ease.standard }
			);
	}

	$effect(() => {
		void focused;
		if (!moveFocus) return;
		moveFocus = false;
		root?.querySelector<HTMLElement>(`[data-date="${focused}"]`)?.focus();
	});

	const gregorian = (d: CalendarDate) => toCalendar(d, new GregorianCalendar());

	function choose(d: CalendarDate) {
		if (blocked(d)) return;
		focused = d;
		if (mode === 'single') {
			value = gregorian(d);
			onchange?.(d);
		} else if (!anchor) {
			anchor = d;
			announce(`${dayName(d)} is the start. Now choose the end date.`);
		} else {
			const [a, b] = ordered(anchor, d);
			anchor = hovered = undefined;
			range = { start: gregorian(a), end: gregorian(b) };
			announce(`Chosen: ${dayName(a)} to ${dayName(b)}`);
			onrangechange?.(range);
		}
	}

	function onkeydown(e: KeyboardEvent) {
		// Escape drops a half-chosen range, before anything around it (a popover) closes.
		if (e.key === 'Escape' && anchor) {
			e.preventDefault();
			e.stopPropagation();
			anchor = hovered = undefined;
			return;
		}
		const rtl = getComputedStyle(root).direction === 'rtl';
		const moves: Record<string, () => CalendarDate> = {
			ArrowLeft: () => focused.add({ days: rtl ? 1 : -1 }),
			ArrowRight: () => focused.add({ days: rtl ? -1 : 1 }),
			ArrowUp: () => focused.subtract({ weeks: 1 }),
			ArrowDown: () => focused.add({ weeks: 1 }),
			PageUp: () => focused.subtract(e.shiftKey ? { years: 1 } : { months: 1 }),
			PageDown: () => focused.add(e.shiftKey ? { years: 1 } : { months: 1 }),
			Home: () => startOfWeek(focused, locale),
			End: () => endOfWeek(focused, locale)
		};
		const move = moves[e.key];
		if (!move) return;
		e.preventDefault();
		hovered = undefined;
		go(move(), true);
	}

	/** Puts the tab stop on the chosen day (or today) and focuses it: a date picker opening. */
	export async function focusDay() {
		anchor = hovered = undefined;
		focused = clampDate(chosen() ?? now);
		first = startOfMonth(focused);
		await tick();
		root?.querySelector<HTMLElement>(`[data-date="${focused}"]`)?.focus();
	}
</script>

<div
	bind:this={root}
	class={['calendar', fill && 'fill', anchor && 'choosing']}
	style:--months={months}
	{@attach (el) => {
		// Leaving the calendar drops the hover preview, back to the day the range started on.
		const clear = () => (hovered = undefined);
		el.addEventListener('pointerleave', clear);
		return () => el.removeEventListener('pointerleave', clear);
	}}
>
	{#each shownMonths as m, mi (mi)}
		<div class="month-block">
			<div class="head">
				{#if mi === 0}
					<Button
						variant="ghost"
						size="sm"
						square
						aria-label="Previous month"
						aria-disabled={(min && first.compare(startOfMonth(shown(min))) <= 0) || undefined}
						onclick={() => (!min || first.compare(startOfMonth(shown(min))) > 0) && page(-1)}
					>
						<Icon icon={ArrowLeft01Icon} size={16} class="flip" />
					</Button>
				{:else}<span class="spacer"></span>{/if}
				<h2 id="{id}-month-{mi}" class="month">{nameOf(m)}</h2>
				{#if mi === months - 1}
					<Button
						variant="ghost"
						size="sm"
						square
						aria-label="Next month"
						aria-disabled={(max && lastMonth.compare(startOfMonth(shown(max))) >= 0) || undefined}
						onclick={() => (!max || lastMonth.compare(startOfMonth(shown(max))) < 0) && page(1)}
					>
						<Icon icon={ArrowRight01Icon} size={16} class="flip" />
					</Button>
				{:else}<span class="spacer"></span>{/if}
			</div>

			<table
				role="grid"
				aria-label="{label}, {nameOf(m)}"
				aria-multiselectable={mode === 'range' || undefined}
				{onkeydown}
			>
				<thead>
					<tr>
						{#each weekdays as w (w.long)}<th scope="col" abbr={w.long}>{w.short}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each weeksOf(m) as week, w (w)}
						<tr>
							{#each week as d (d.toString())}
								{#if isSameMonth(d, m)}
									{@const selected = isSelected(d)}
									{@const inside = mode === 'range' && inBand(d)}
									<td
										role="gridcell"
										aria-selected={mode === 'range' ? inside : selected}
										class={[
											inside && 'in-band',
											inside && band && isSameDay(d, band[0]) && 'band-start',
											inside && band && isSameDay(d, band[1]) && 'band-end'
										]}
									>
										<button
											type="button"
											class={[
												'day',
												selected && 'selected',
												anchor && isSameDay(d, anchor) && 'anchor',
												isSameDay(d, now) && 'today'
											]}
											data-date={d.toString()}
											tabindex={isSameDay(d, focused) ? 0 : -1}
											aria-label="{dayName(d)}{isSameDay(d, now) ? ', today' : ''}"
											aria-disabled={blocked(d) || undefined}
											onpointerenter={() => anchor && !blocked(d) && (hovered = d)}
											onclick={() => {
												focused = d;
												choose(d);
											}}>{digits.format(d.day)}</button
										>
									</td>
								{:else}
									<td></td>
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
</div>

<style>
	.calendar {
		display: flex;
		flex-wrap: wrap;
		/* Months that wrap onto a new line sit centered under the others. */
		justify-content: center;
		gap: 0.5rem 1.5rem;
		/* The range band sits under the days; this keeps it above whatever is behind the calendar. */
		isolation: isolate;
		inline-size: max-content;
		max-inline-size: 100%;
		color: var(--ui-fg);
		font: 0.875rem/1 var(--ui-font);
		font-variant-numeric: tabular-nums;
	}
	/* Filling: the grid spreads evenly and each day widens with its column. */
	.month-block {
		display: grid;
		gap: 0.5rem;
		align-content: start;
	}
	.fill {
		inline-size: 100%;
	}
	.fill .month-block {
		flex: 1;
	}
	.fill table {
		inline-size: 100%;
		table-layout: fixed;
	}
	.fill .day {
		inline-size: 100%;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.spacer {
		inline-size: 2rem;
	}
	.month {
		margin: 0;
		font-family: var(--ui-font-heading);
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.head :global(.flip:dir(rtl)) {
		transform: scaleX(-1);
	}
	table {
		border-collapse: collapse;
		/* Only the body slides between months; clip it to the grid. */
		overflow: clip;
	}
	/* content-box set here, so an app's border-box reset (Tailwind) doesn't shrink the grid. */
	th {
		box-sizing: content-box;
		block-size: 2rem;
		padding: 1px;
		color: var(--ui-muted);
		font-size: 0.75rem;
		font-weight: 500;
	}
	/* Every cell is a day tall, empty ones too: a month with an empty sixth row is the same height. */
	td {
		position: relative;
		box-sizing: content-box;
		block-size: calc(2.25rem + 2px);
		padding: 1px;
		text-align: center;
	}
	@media (pointer: coarse) {
		td {
			block-size: calc(2.75rem + 2px);
		}
	}
	.day {
		position: relative;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		/* Narrows on a 320px phone so seven days fit beside the page gutters. */
		inline-size: min(var(--ui-item-h), (100vw - 5rem) / 7);
		block-size: var(--ui-item-h);
		margin: 0;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--ui-radius);
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		/* Above the range band, whatever it's animating. States switch at once: fading the fill while
		   the number turns white leaves it unreadable for a moment. */
		z-index: 1;
		transition: transform var(--ui-dur-press) var(--ui-ease-out);
	}
	@media (pointer: coarse) {
		.day {
			inline-size: min(2.75rem, (100vw - 5rem) / 7);
			block-size: 2.75rem;
		}
	}
	@media (hover: hover) and (pointer: fine) {
		.day:not(.selected, [aria-disabled='true']):hover {
			background: var(--ui-subtle);
		}
	}
	.day:active:not([aria-disabled='true']) {
		transform: scale(0.94);
	}
	.day:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: 0;
	}
	/* Today: a small mark under the number, so it reads without relying on color. */
	.today::after {
		content: '';
		position: absolute;
		inset-block-end: 0.3rem;
		inline-size: 0.25rem;
		block-size: 0.25rem;
		border-radius: 50%;
		background: currentColor;
	}
	.selected {
		background: var(--ui-accent);
		color: var(--ui-on-accent);
		font-weight: 600;
		/* The chosen day settles in with a small pop. */
		animation: pop 220ms var(--ui-ease-out);
	}
	@keyframes pop {
		from {
			transform: scale(0.82);
		}
	}
	/* Unavailable: grayed, and the cursor says it can't be chosen (screen readers hear "dimmed"). */
	.day[aria-disabled='true'] {
		color: var(--ui-muted);
		opacity: 0.55;
		cursor: not-allowed;
	}
	/* Range: one band runs under the days, from the middle of the start day to the middle of the end.
	   It belongs to the cell, so a day animating can never paint it over itself. */
	td::before {
		content: '';
		position: absolute;
		/* Neighboring cells' bands meet edge to edge, without a seam. */
		inset: 1px 0;
		background: color-mix(in srgb, var(--ui-accent) 14%, var(--ui-surface));
		opacity: 0;
		transition: opacity 120ms ease;
	}
	td.in-band::before {
		opacity: 1;
	}
	/* Choosing: the band is a lighter preview until the end is picked. */
	/* The end pops once, when it's chosen, not on every day the pointer passes. */
	.choosing .selected:not(.anchor) {
		animation: none;
	}
	.choosing td.in-band::before {
		background: color-mix(in srgb, var(--ui-accent) 9%, var(--ui-surface));
	}
	td.band-start::before {
		inset-inline-start: 50%;
	}
	td.band-end::before {
		inset-inline-end: 50%;
	}
	td.band-start.band-end::before {
		opacity: 0;
	}
	/* The band rounds off at the ends of each week row, flush with the day's edge. */
	td:first-child:not(.band-start)::before {
		inset-inline-start: 1px;
		border-start-start-radius: var(--ui-radius);
		border-end-start-radius: var(--ui-radius);
	}
	td:last-child:not(.band-end)::before {
		inset-inline-end: 1px;
		border-start-end-radius: var(--ui-radius);
		border-end-end-radius: var(--ui-radius);
	}
	@media (hover: hover) and (pointer: fine) {
		.in-band .day:not(.selected):hover {
			background: color-mix(in srgb, var(--ui-accent) 18%, transparent);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.selected {
			animation: none;
		}
	}
	@media (forced-colors: active) {
		.selected {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
		}
	}
</style>
