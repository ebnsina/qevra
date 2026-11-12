<script lang="ts" generics="T extends Item">
	import type { Snippet } from 'svelte';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import CrudSheet from './CrudSheet.svelte';
	import type { Field, Item } from './fields.ts';

	interface Props {
		/** Page heading: "Reviews". */
		title: string;
		/** One of them: "review". */
		noun: string;
		/** Shown when the list is empty: what these are for. */
		empty: string;
		items: T[];
		/** Table columns; the first one opens the row. `text` formats a cell; `cell` draws it (a badge). */
		columns: { label: string; text?: (item: T) => string; numeric?: boolean }[];
		cell?: Snippet<[T, number]>;
		fields: Field[];
		form?: { code?: string; errors?: Record<string, string>; values?: Record<string, string> } | null;
		/** More buttons in an open row's sheet (a link to its lessons). */
		rowActions?: Snippet<[T]>;
	}
	let { title, noun, empty, items, columns, cell, fields, form, rowActions }: Props = $props();

	let open = $state(false);
	let openId = $state<string | null>(null);
	const selected = $derived(items.find((item) => item.id === openId) ?? null);

	function show(id: string | null) {
		openId = id;
		open = true;
	}
</script>

<div class="app-page">
	<PageHeader title={title}>
		{#snippet actions()}<Button onclick={() => show(null)}>New {noun}</Button>{/snippet}
	</PageHeader>

	<Card flush>
		{#if items.length}
			<Table caption={title} hideCaption>
				<thead>
					<tr>{#each columns as column (column.label)}<th class={{ num: column.numeric }}>{column.label}</th>{/each}</tr>
				</thead>
				<tbody>
					{#each items as item (item.id)}
						<tr onclick={() => show(String(item.id))}>
							{#each columns as column, i (column.label)}
								<td class={{ num: column.numeric }}>
									{#if i === 0}
										<RowLink label={column.text?.(item) ?? ''} onclick={() => show(String(item.id))} />
									{:else if column.text}
										{column.text(item)}
									{:else}
										{@render cell?.(item, i)}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<EmptyState title="No {title.toLowerCase()} yet">
				{empty}
				{#snippet actions()}<Button onclick={() => show(null)}>New {noun}</Button>{/snippet}
			</EmptyState>
		{/if}
	</Card>
</div>

<CrudSheet bind:open {noun} {fields} item={selected} {form}>
	{#snippet actions()}{#if selected}{@render rowActions?.(selected)}{/if}{/snippet}
</CrudSheet>
