<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import RollingNumber from './RollingNumber.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		label: string;
		/** Keeps the label for screen readers only (the page already says it nearby). */
		hideLabel?: boolean;
		/** Leave unset while the amount of work is unknown: the bar sweeps instead of filling. */
		value?: number;
		max?: number;
		/** Show the formatted value beside the label. */
		showValue?: boolean;
		/** Formats the value for display and for screen readers. Defaults to a percentage. */
		format?: (value: number, max: number) => string;
		/** Locale for the default percentage format; fixed so server and browser render the same text. */
		locale?: string;
		/** circle: a ring with the value in the middle and the label under it. */
		shape?: 'bar' | 'circle';
		/** The ring's diameter in px. */
		size?: number;
	}

	const uid = $props.id();
	let {
		label,
		hideLabel = false,
		value,
		max = 100,
		showValue = true,
		format,
		locale = 'en',
		shape = 'bar',
		size = 72,
		class: className,
		...rest
	}: Props = $props();

	const ratio = $derived(value === undefined ? 0 : Math.min(Math.max(value / max, 0), 1));
	const text = $derived(
		value === undefined
			? undefined
			: format
				? format(value, max)
				: new Intl.NumberFormat(locale, { style: 'percent' }).format(ratio)
	);
</script>

{#if shape === 'circle'}
	<div class={['progress', 'circle', className]} {...rest}>
		<div
			class={['dial', value === undefined && 'indeterminate']}
			style:--size="{size}px"
			role="progressbar"
			aria-labelledby="{uid}-label"
			aria-valuemin={0}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-valuetext={text}
		>
			<svg viewBox="0 0 36 36" aria-hidden="true">
				<circle class="ring-track" cx="18" cy="18" r="15.5" />
				<circle
					class="ring-fill"
					cx="18"
					cy="18"
					r="15.5"
					pathLength="1"
					style:stroke-dashoffset={value === undefined ? undefined : 1 - ratio}
				/>
			</svg>
			{#if showValue && text}<span class="ring-value" aria-hidden="true"
					><RollingNumber value={text} /></span
				>{/if}
		</div>
		<span id="{uid}-label" class={['ring-label', hideLabel && 'sr-only']}>{label}</span>
	</div>
{:else}
	<div class={['progress', className]} {...rest}>
		<div class={['head', hideLabel && !showValue && 'sr-only']}>
			<span id="{uid}-label" class:sr-only={hideLabel}>{label}</span>
			{#if showValue && text}<span class="value" aria-hidden="true"
					><RollingNumber value={text} /></span
				>{/if}
		</div>
		<div
			class={['track', value === undefined && 'indeterminate']}
			role="progressbar"
			aria-labelledby="{uid}-label"
			aria-valuemin={0}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-valuetext={text}
		>
			<div
				class="fill"
				style:transform={value === undefined ? undefined : `scaleX(${ratio})`}
			></div>
		</div>
	</div>
{/if}

<style>
	/* A bar fills its column, so its length never follows the label's. */
	.progress {
		inline-size: 100%;
		display: grid;
		gap: 0.375rem;
		font: 0.875rem/1.4 var(--ui-font);
		color: var(--ui-fg);
	}
	.head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.value {
		color: var(--ui-muted);
		font-variant-numeric: tabular-nums;
	}
	.track {
		position: relative;
		block-size: 0.5rem;
		overflow: hidden;
		border-radius: 999px;
		background: var(--ui-hover);
	}
	/* scaleX, not width: filling runs on the compositor. */
	.fill {
		block-size: 100%;
		border-radius: inherit;
		background: var(--ui-accent);
		transform-origin: left;
		transform: scaleX(0);
		transition: transform 300ms var(--ui-ease-out);
	}
	.track:dir(rtl) .fill {
		transform-origin: right;
	}
	/* Unknown amount: a segment sweeps across (constant motion, so linear). */
	.indeterminate .fill {
		inline-size: 40%;
		transform: none;
		animation: sweep 1.4s linear infinite;
	}
	@keyframes sweep {
		from {
			translate: -100%;
		}
		to {
			translate: 250%;
		}
	}
	.indeterminate:dir(rtl) .fill {
		animation-direction: reverse;
	}
	/* Ring: the arc fills from twelve o'clock, clockwise. */
	.circle {
		inline-size: auto;
		justify-items: center;
		gap: 0.5rem;
	}
	.dial {
		position: relative;
		display: grid;
		place-items: center;
		inline-size: var(--size);
		block-size: var(--size);
	}
	.dial svg {
		position: absolute;
		inset: 0;
		rotate: -90deg;
	}
	.dial circle {
		fill: none;
		stroke-width: 3.5;
	}
	.ring-track {
		stroke: var(--ui-hover);
	}
	.ring-fill {
		stroke: var(--ui-accent);
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		transition: stroke-dashoffset 400ms var(--ui-ease-out);
	}
	.dial:dir(rtl) svg {
		scale: 1 -1;
	}
	/* Unknown amount: a quarter arc turning (constant motion, so linear). */
	.dial.indeterminate svg {
		animation: turn 1s linear infinite;
	}
	.dial.indeterminate .ring-fill {
		stroke-dashoffset: 0.72;
	}
	@keyframes turn {
		to {
			rotate: 270deg;
		}
	}
	.ring-value {
		font: 600 calc(var(--size) * 0.22) / 1 var(--ui-font);
		font-variant-numeric: tabular-nums;
	}
	.ring-label {
		color: var(--ui-muted);
	}
	@media (prefers-reduced-motion: reduce) {
		.ring-fill {
			transition: none;
		}
		.dial.indeterminate svg {
			animation: pulse 2s ease-in-out infinite;
		}
		.fill {
			transition: none;
		}
		.indeterminate .fill {
			inline-size: 100%;
			animation: pulse 2s ease-in-out infinite;
		}
		@keyframes pulse {
			50% {
				opacity: 0.35;
			}
		}
	}
	@media (forced-colors: active) {
		.fill {
			forced-color-adjust: none;
			background: Highlight;
		}
		.track {
			outline: 1px solid CanvasText;
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
