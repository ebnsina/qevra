<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getRadioGroup } from './context';

	interface Props extends Omit<
		HTMLInputAttributes,
		'type' | 'value' | 'name' | 'checked' | 'children'
	> {
		value: string;
		children: Snippet;
		hint?: string;
	}

	const uid = $props.id();
	let { value, children, hint, id = uid, class: className, ...rest }: Props = $props();
	const group = getRadioGroup();
</script>

<div class={['radio', className]}>
	<span class="control">
		<input
			type="radio"
			{id}
			name={group.name}
			{value}
			checked={group.value === value}
			disabled={group.disabled || rest.disabled}
			required={group.required}
			data-invalid={group.invalid || undefined}
			aria-describedby={hint ? `${id}-hint` : undefined}
			{...rest}
			onchange={(e) => {
				group.select(value);
				rest.onchange?.(e);
			}}
		/>
		<!-- Not named "ring": Tailwind generates a .ring utility for any file mentioning it. -->
		<span class="circle" aria-hidden="true">
			<span class="well"><span class="dot"></span></span>
		</span>
	</span>
	<span class="text">
		<label for={id}>{@render children()}</label>
		{#if hint}<span id="{id}-hint" class="hint">{hint}</span>{/if}
	</span>
</div>

<style>
	.radio {
		display: inline-flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.control {
		position: relative;
		display: grid;
		flex: none;
		block-size: 1.5em;
		place-items: center;
	}
	/* Real input over the ring, with a 44px target for touch. */
	input {
		position: absolute;
		inset: 50% auto auto 50%;
		translate: -50% -50%;
		z-index: 1;
		inline-size: 2.75rem;
		block-size: 2.75rem;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	/* Thick ring, a gap, then the dot. */
	.circle {
		/* Softer than --ui-control-line by request: 2.05:1 light / 2.5:1 dark, under WCAG's 3:1 for
		   control outlines. The 2px weight keeps it visible; hover restores full contrast. */
		--radio-line: light-dark(rgb(15 23 42 / 0.32), rgb(255 255 255 / 0.28));
		position: relative;
		display: grid;
		inline-size: 1.25rem;
		block-size: 1.25rem;
		box-sizing: border-box;
		border: 2px solid var(--radio-line);
		border-radius: 50%;
		background: var(--ui-surface);
		transition: border-color var(--ui-dur) ease;
	}
	.well {
		display: grid;
		place-items: center;
		overflow: hidden;
		border-radius: 50%;
	}
	.dot {
		inline-size: 0.625rem;
		block-size: 0.625rem;
		border-radius: 50%;
		background: var(--ui-accent);
		opacity: 0;
		/* Chosen: the dot grows in place, quickly. */
		scale: 0.4;
		transition:
			opacity 120ms ease,
			scale 120ms var(--ui-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		input:hover:not(:checked, :disabled) ~ .circle {
			border-color: var(--ui-control-line);
		}
	}
	input:checked ~ .circle {
		border-color: var(--ui-accent);
	}
	input:checked ~ .circle .dot {
		opacity: 1;
		scale: 1;
	}
	input:focus-visible ~ .circle {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	input[data-invalid] ~ .circle {
		border-color: var(--ui-danger);
	}
	input[data-invalid]:focus-visible ~ .circle {
		outline-color: var(--ui-danger);
	}
	.text {
		position: relative;
		z-index: 2;
		display: grid;
	}
	label {
		cursor: pointer;
	}
	.hint {
		color: var(--ui-muted);
		font-size: 0.8125rem;
	}
	/* Dim the control and label only: a hint often explains why it's unavailable, so it stays readable. */
	.radio:has(input:disabled) :is(.control, label) {
		opacity: 0.55;
	}
	.radio:has(input:disabled) :is(input, label) {
		cursor: not-allowed;
	}
	@media (prefers-reduced-motion: reduce) {
		.circle,
		.dot {
			transition: none;
		}
	}
	@media (forced-colors: active) {
		input:checked ~ .circle {
			border-color: Highlight;
		}
		.dot {
			forced-color-adjust: none;
			background: Highlight;
		}
	}
</style>
