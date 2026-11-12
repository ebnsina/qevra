<script lang="ts" module>
	import type { Home01Icon } from '@hugeicons/core-free-icons';

	export interface DetailField {
		label: string;
		value: string;
		/** A small muted icon before the label, to help scanning. */
		icon?: typeof Home01Icon;
		/** Numbers, ids and codes: set in the mono font with even digit widths. */
		mono?: boolean;
	}
</script>

<script lang="ts">
	// One record with all its fields and actions, in a wide side sheet; the table behind stays compact.
	import type { Snippet } from 'svelte';
	import Dialog from '../../ui/Dialog.svelte';
	import Icon from '../../ui/Icon.svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		fields: DetailField[];
		/** Above the fields: status badges, a summary, an error. */
		lead?: Snippet;
		/** Below the fields: a form, a list, a note. */
		children?: Snippet;
		/** Actions, right-aligned: Cancel first, the main one last. */
		footer?: Snippet;
		/** Accessible name of the close button; translate it for non-English UIs. */
		closeLabel?: string;
	}
	let {
		open = $bindable(),
		title,
		description,
		fields,
		lead,
		children,
		footer,
		closeLabel = 'Close'
	}: Props = $props();
</script>

<Dialog bind:open side="end" {title} {description} {closeLabel} {footer}>
	{#if lead}<div class="lead">{@render lead()}</div>{/if}
	<dl>
		{#each fields as field (field.label)}
			<div>
				<dt>
					{#if field.icon}<Icon icon={field.icon} size={15} />{/if}{field.label}
				</dt>
				<dd class={{ mono: field.mono }}>{field.value}</dd>
			</div>
		{/each}
	</dl>
	{#if children}<div class="more">{@render children()}</div>{/if}
</Dialog>

<style>
	.lead {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-block-end: 1.25rem;
	}
	dl {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 1.125rem 1.5rem;
		margin: 0;
	}
	dt {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--ui-muted);
		font-size: 0.8125rem;
	}
	dd {
		margin: 0.125rem 0 0;
		font-weight: 500;
		overflow-wrap: anywhere;
	}
	.mono {
		font-family: var(--ui-font-mono);
		font-variant-numeric: tabular-nums;
	}
	.more {
		margin-block-start: 1.5rem;
	}
</style>
