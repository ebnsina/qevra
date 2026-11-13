<script lang="ts">
	// A date and a time side by side, sent as one form value ("2026-11-20T17:30", Bangladesh time).
	import { untrack } from 'svelte';
	import { parseDate, parseTime, type CalendarDate, type Time } from '@internationalized/date';
	import DatePicker from '#lib/sinaui/ui/DatePicker.svelte';
	import TimeField from '#lib/sinaui/ui/TimeField.svelte';

	interface Props {
		label: string;
		name: string;
		/** "YYYY-MM-DDTHH:MM", or empty. */
		value?: string;
		required?: boolean;
		hint?: string;
		error?: string;
	}
	let { label, name, value = '', required = false, hint, error }: Props = $props();

	// The saved value fills the two parts once; after that they are the person's own.
	const saved = untrack(() => value);
	let date = $state<CalendarDate | undefined>(saved ? parseDate(saved.slice(0, 10)) : undefined);
	let time = $state<Time | undefined>(saved ? parseTime(saved.slice(11, 16)) : undefined);
	const two = (n: number) => String(n).padStart(2, '0');
	// Both parts or nothing: half a date-time is never sent.
	const joined = $derived(date && time ? `${date.toString()}T${two(time.hour)}:${two(time.minute)}` : '');
</script>

<fieldset>
	<legend>{label}</legend>
	<div class="pair">
		<DatePicker label="Date" hideLabel bind:value={date} placeholder="Choose a date" locale="en-GB" />
		<TimeField label="Time" bind:value={time} locale="en-GB" hourCycle={12} minuteStep={5} bare />
	</div>
	<input type="hidden" {name} value={joined} {required} />
	{#if error}<p class="error" role="alert">{error}</p>{:else if hint}<p class="hint">{hint}</p>{/if}
</fieldset>

<style>
	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		margin-bottom: 0.375rem;
		font-size: var(--ui-font-size);
		font-weight: 500;
	}
	.pair {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.hint,
	.error {
		margin-top: 0.375rem;
		font-size: 0.8125rem;
		color: var(--ui-muted);
	}
	.error {
		color: var(--ui-danger);
	}
</style>
