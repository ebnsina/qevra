<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Cancel01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';

	interface Props {
		open?: boolean;
		title: string;
		description?: string;
		closeLabel?: string;
		children?: Snippet;
		footer?: Snippet;
		class?: string;
	}

	let {
		open = $bindable(false),
		title,
		description,
		closeLabel = 'Close',
		children,
		footer,
		class: className
	}: Props = $props();

	const id = $props.id();
	let dialog: HTMLDialogElement;
	let body: HTMLDivElement;

	// showModal(): focus trap, inert page, Escape and focus return, all native.
	$effect(() => {
		if (open && !dialog.open) {
			dialog.showModal();
			dialog.focus();
		} else if (!open && dialog.open) dialog.close();
	});

	// Drag to dismiss (Emil's drawer recipe): the sheet follows the finger down, resists going up,
	// and closes past 30% of its height or on a flick. Moved directly, never through state.
	let drag: { id: number; y: number; t: number; dy: number } | undefined;

	function down(e: PointerEvent) {
		if (
			drag ||
			e.button !== 0 ||
			(e.target as Element).closest('button, a, input, select, textarea')
		)
			return;
		// From the content, only when it's scrolled to the top: otherwise the finger is scrolling.
		if (body.contains(e.target as Node) && body.scrollTop > 0) return;
		drag = { id: e.pointerId, y: e.clientY, t: performance.now(), dy: 0 };
	}
	function move(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.id) return;
		const raw = e.clientY - drag.y;
		if (!dialog.classList.contains('dragging')) {
			// Only a downward pull becomes a drag; an upward move is left to scrolling.
			if (raw < 4) return;
			// Can throw if the pointer is already gone; the drag works without capture too.
			try {
				dialog.setPointerCapture(e.pointerId);
			} catch {
				/* no capture */
			}
			dialog.classList.add('dragging');
		}
		drag.dy = raw >= 0 ? raw : -(Math.abs(raw) ** 0.6);
		dialog.style.translate = `0 ${drag.dy}px`;
		dialog.style.setProperty('--pull', String(Math.max(0, drag.dy) / dialog.offsetHeight));
	}
	function up(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.id) return;
		const { dy, t } = drag;
		drag = undefined;
		if (!dialog.classList.contains('dragging')) return;
		dialog.classList.remove('dragging');
		const velocity = dy / (performance.now() - t);
		// Clearing the inline offset lets the transition carry it from where it was let go.
		dialog.style.translate = '';
		dialog.style.removeProperty('--pull');
		if (dy > dialog.offsetHeight * 0.3 || (dy > 12 && velocity > 0.5)) dialog.close();
	}

	let pressedBackdrop = false;
</script>

<dialog
	bind:this={dialog}
	tabindex="-1"
	class={['drawer', className]}
	aria-labelledby="{id}-title"
	aria-describedby={description ? `${id}-desc` : undefined}
	onclose={() => (open = false)}
	onpointerdown={(e) => {
		pressedBackdrop = e.target === dialog;
		down(e);
	}}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={up}
	onclick={(e) => {
		if (pressedBackdrop && e.target === dialog) dialog.close();
	}}
>
	<div class="sheet">
		<div class="handle" aria-hidden="true"></div>
		<header>
			<div class="titles">
				<h2 id="{id}-title">{title}</h2>
				{#if description}<p id="{id}-desc">{description}</p>{/if}
			</div>
			<button type="button" class="close" aria-label={closeLabel} onclick={() => dialog.close()}>
				<Icon icon={Cancel01Icon} />
			</button>
		</header>
		<div class="body" bind:this={body}>{@render children?.()}</div>
		{#if footer}<footer>{@render footer()}</footer>{/if}
	</div>
</dialog>

<style>
	/* Pinned to the bottom; slides up on the drawer curve and back down from wherever it's let go. */
	.drawer {
		box-sizing: border-box;
		inline-size: min(40rem, 100%);
		max-inline-size: 100%;
		max-block-size: 90dvh;
		margin: auto auto 0;
		padding: 0;
		overflow: hidden;
		border: 1px solid transparent;
		border-block-end: 0;
		border-radius: calc(var(--ui-radius) * 2) calc(var(--ui-radius) * 2) 0 0;
		background: var(--ui-surface-overlay);
		color: var(--ui-fg);
		font: var(--ui-font-size)/1.5 var(--ui-font);
		box-shadow: var(--ui-shadow-overlay);
		touch-action: pan-y;
		translate: 0 100%;
		transition-property: translate, overlay, display;
		transition-duration: 320ms;
		transition-timing-function: var(--ui-ease-drawer);
		transition-behavior: allow-discrete;
	}
	.drawer:focus {
		outline: none;
	}
	.drawer[open] {
		translate: 0 0;
	}
	@starting-style {
		.drawer[open] {
			translate: 0 100%;
		}
	}
	/* While dragging, the sheet follows the finger exactly: no easing in the way. */
	.drawer:global(.dragging) {
		transition: none;
		user-select: none;
	}
	.drawer::backdrop {
		background: var(--ui-backdrop);
		opacity: 0;
		transition-property: opacity, overlay, display;
		transition-duration: 320ms;
		transition-timing-function: var(--ui-ease-drawer);
		transition-behavior: allow-discrete;
	}
	/* The backdrop lightens as the sheet is pulled down. */
	.drawer[open]::backdrop {
		opacity: calc(1 - var(--pull, 0));
	}
	@starting-style {
		.drawer[open]::backdrop {
			opacity: 0;
		}
	}
	.sheet {
		display: flex;
		flex-direction: column;
		max-block-size: 90dvh;
	}
	.handle {
		flex: none;
		inline-size: 2.5rem;
		block-size: 0.3125rem;
		margin: 0.625rem auto 0;
		border-radius: 999px;
		background: var(--ui-control-line);
		cursor: grab;
	}
	header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding-block: 0.75rem 0.5rem;
		padding-inline: 1.5rem 1rem;
		cursor: grab;
	}
	.titles {
		flex: 1;
		min-inline-size: 0;
	}
	h2 {
		margin: 0.25rem 0 0;
		font-family: var(--ui-font-heading);
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.02em;
	}
	.titles p {
		margin: 0.125rem 0 0;
		color: var(--ui-muted);
		font-size: 0.875rem;
	}
	.close {
		display: grid;
		flex: none;
		place-items: center;
		inline-size: 2.25rem;
		block-size: 2.25rem;
		/* Same as Dialog: the icon sits on the title's line. */
		margin: -0.25rem 0 0;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--ui-radius);
		background: none;
		color: var(--ui-muted);
		cursor: pointer;
	}
	@media (pointer: coarse) {
		.close {
			inline-size: 2.75rem;
			block-size: 2.75rem;
		}
	}
	@media (hover: hover) and (pointer: fine) {
		.close:hover {
			background: var(--ui-subtle);
			color: var(--ui-fg);
		}
	}
	.close:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	.body {
		flex: 1;
		min-block-size: 0;
		overflow: auto;
		overscroll-behavior: contain;
		padding: 0.25rem 1.5rem 1rem;
	}
	footer {
		display: flex;
		flex-wrap: wrap-reverse;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem max(1rem, env(safe-area-inset-bottom));
	}
	@media (prefers-reduced-motion: reduce) {
		.drawer,
		.drawer[open] {
			translate: 0 0;
			transition-property: opacity, overlay, display;
			opacity: 0;
		}
		.drawer[open] {
			opacity: 1;
		}
		@starting-style {
			.drawer[open] {
				translate: 0 0;
				opacity: 0;
			}
		}
	}
</style>
