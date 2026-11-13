<script lang="ts">
	import { Calendar03Icon } from '@hugeicons/core-free-icons';
	import { type CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import Calendar from './Calendar.svelte';
	import Icon from './Icon.svelte';
	import Popover from './Popover.svelte';
	import type { CustomCalendar } from './calendars/bangla';

	interface Props {
		label: string;
		/** Keeps the label for screen readers only. */
		hideLabel?: boolean;
		value?: CalendarDate;
		placeholder?: string;
		hint?: string;
		error?: string;
		/** Form field name: a hidden input carries the date as YYYY-MM-DD. */
		name?: string;
		locale?: string;
		/** Calendar system shown ('islamic-umalqura'...); the value stays Gregorian. */
		calendar?: string | CustomCalendar;
		min?: CalendarDate;
		max?: CalendarDate;
		isUnavailable?: (date: CalendarDate) => boolean;
		disabled?: boolean;
	}

	let {
		label,
		hideLabel = false,
		value = $bindable(),
		placeholder = 'Choose a date',
		hint,
		error,
		name,
		locale = 'en',
		calendar = 'gregory',
		min,
		max,
		isUnavailable,
		disabled = false
	}: Props = $props();

	const id = $props.id();
	let open = $state(false);
	let grid = $state<ReturnType<typeof Calendar>>();
	const text = $derived(
		!value
			? undefined
			: typeof calendar === 'string'
				? new DateFormatter(locale, { dateStyle: 'medium', calendar }).format(
						value.toDate(getLocalTimeZone())
					)
				: calendar.format(value, locale)
	);
	const describedby = $derived(
		[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
	);

	// Opening lands on the chosen day (or today), not the month buttons: arrows work straight away.
	$effect(() => {
		if (open) requestAnimationFrame(() => grid?.focusDay());
	});
</script>

<div class="field">
	<span id="{id}-label" class="label" class:sr-only={hideLabel}>{label}</span>
	<Popover bind:open title={label} hideTitle class="date-popover">
		{#snippet trigger(props)}
			<button
				type="button"
				class={['trigger', !text && 'placeholder']}
				aria-labelledby="{id}-label {id}-value"
				aria-describedby={describedby}
				data-invalid={error ? true : undefined}
				{disabled}
				{...props}
			>
				<span id="{id}-value">{text ?? placeholder}</span>
				<Icon icon={Calendar03Icon} size={16} />
			</button>
		{/snippet}
		<Calendar
			bind:this={grid}
			bind:value
			{label}
			{locale}
			{calendar}
			{min}
			{max}
			{isUnavailable}
			onchange={() => (open = false)}
		/>
	</Popover>
	{#if name}<input type="hidden" {name} value={value?.toString() ?? ''} />{/if}
	{#if hint}<p id="{id}-hint" class="hint">{hint}</p>{/if}
	{#if error}<p id="{id}-error" class="error">{error}</p>{/if}
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
	}
	/* The calendar keeps its natural width (days close together read as a month), not the field's. */
	.field :global(.date-popover) {
		max-inline-size: calc(100vw - 16px);
		padding: 0.75rem;
	}
	/* Same box as Input and Select. */
	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		box-sizing: border-box;
		inline-size: 100%;
		min-block-size: var(--ui-control-h);
		margin: 0;
		padding: 0 0.75rem;
		border: 1px solid var(--ui-field-line);
		border-radius: var(--ui-radius-control);
		background: var(--ui-surface);
		color: inherit;
		font: inherit;
		font-size: var(--ui-control-font);
		font-variant-numeric: tabular-nums;
		text-align: start;
		cursor: pointer;
	}
	@media (pointer: coarse) {
		.trigger {
			min-block-size: var(--ui-control-h-touch);
		}
	}
	.trigger :global(svg) {
		color: var(--ui-muted);
	}
	.placeholder {
		color: var(--ui-muted);
	}
	.trigger:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	.trigger[data-invalid] {
		border-color: var(--ui-danger);
	}
	.trigger[data-invalid]:focus-visible {
		outline-color: var(--ui-danger);
	}
	.trigger:disabled {
		background: var(--ui-subtle);
		opacity: 0.55;
		cursor: not-allowed;
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
	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
