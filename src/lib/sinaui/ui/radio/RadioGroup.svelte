<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLFieldsetAttributes } from 'svelte/elements';
	import { setRadioGroup } from './context';

	interface Props extends HTMLFieldsetAttributes {
		/** The question the options answer; every radio group needs one. */
		legend: string;
		value?: string;
		/** Form field name. Defaults to a unique id so separate groups never merge. */
		name?: string;
		disabled?: boolean;
		/** One choice must be made before the form sends. */
		required?: boolean;
		/** Help for the whole group, read out with the question. */
		hint?: string;
		/** Error for the whole group ("Choose a reading room"). */
		error?: string;
		orientation?: 'vertical' | 'horizontal';
		children: Snippet;
	}

	const uid = $props.id();
	let {
		legend,
		value = $bindable(),
		name = uid,
		disabled = false,
		required = false,
		hint,
		error,
		orientation = 'vertical',
		children,
		class: className,
		...rest
	}: Props = $props();

	setRadioGroup({
		get name() {
			return name;
		},
		get value() {
			return value;
		},
		get disabled() {
			return disabled;
		},
		get required() {
			return required;
		},
		get invalid() {
			return !!error;
		},
		select(v) {
			value = v;
		}
	});
</script>

<!-- fieldset + legend: the group is announced with its question, and native radios supply arrow keys. -->
<fieldset
	class={['group', orientation, className]}
	{disabled}
	aria-describedby={[hint && `${uid}-hint`, error && `${uid}-error`].filter(Boolean).join(' ') ||
		undefined}
	{...rest}
>
	<legend>{legend}</legend>
	{#if hint}<p id="{uid}-hint" class="hint">{hint}</p>{/if}
	<div class="options">
		{@render children()}
	</div>
	{#if error}<p id="{uid}-error" class="error">{error}</p>{/if}
</fieldset>

<style>
	.group {
		margin: 0;
		padding: 0;
		border: 0;
		min-inline-size: 0;
		font: var(--ui-font-size)/1.5 var(--ui-font);
		color: var(--ui-fg);
	}
	legend {
		margin-block-end: 0.5rem;
		padding: 0;
		font-weight: 500;
	}
	.hint,
	.error {
		margin: 0;
		font-size: 0.8125rem;
	}
	.hint {
		margin-block: -0.25rem 0.5rem;
		color: var(--ui-muted);
	}
	.error {
		margin-block-start: 0.5rem;
		color: var(--ui-danger);
	}
	.options {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.horizontal .options {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
	}
</style>
