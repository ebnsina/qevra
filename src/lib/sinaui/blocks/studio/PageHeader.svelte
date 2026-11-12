<script lang="ts">
	// The top of a page inside the app: its title, one line about it, and its controls on the right.
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		/** Page controls, right-aligned: filters and view options first, the main action last. */
		actions?: Snippet;
	}
	let { title, description, actions }: Props = $props();
</script>

<div class="page-head">
	<div>
		<h1>{title}</h1>
		{#if description}<p>{description}</p>{/if}
	</div>
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</div>

<style>
	.page-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		margin: 0;
		font-family: var(--ui-font-heading, inherit);
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.25;
		letter-spacing: -0.01em;
	}
	p {
		margin: 0.25rem 0 0;
		color: var(--ui-muted);
		font-size: 0.9375rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.5rem;
	}
</style>
