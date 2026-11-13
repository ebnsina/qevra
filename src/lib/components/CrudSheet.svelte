<script lang="ts">
	import type { Snippet } from 'svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import ConfirmButton from '#lib/sinaui/ui/ConfirmButton.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import { message } from '#lib/messages.ts';
	import { mutating, withRow } from '#lib/admin-query.svelte.ts';
	import Fields from './Fields.svelte';
	import type { Field, Item } from './fields.ts';

	interface Props {
		open: boolean;
		/** What one of these is called: "review", "lesson". */
		noun: string;
		fields: Field[];
		/** The row being edited, or null to add a new one. */
		item: Item | null;
		/** The page's form actions: `?/save` and `?/delete` by default. */
		saveAction?: string;
		deleteAction?: string;
		/** Starting values for a new row (the section a new lesson goes in). */
		defaults?: Item;
		/** Values sent along with the form (which course a lesson belongs to). */
		hidden?: Record<string, string>;
		/** The page's last action result, for error messages. */
		form?: { code?: string; errors?: Record<string, string>; values?: Record<string, string> } | null;
		/** More about this row, under the form (a lesson's quiz). */
		children?: Snippet;
		/** More buttons at the start of the footer. */
		actions?: Snippet;
	}
	let {
		open = $bindable(),
		noun,
		fields,
		item,
		saveAction = '?/save',
		deleteAction = '?/delete',
		defaults,
		hidden = {},
		form,
		children,
		actions
	}: Props = $props();

	const uid = $props.id();
	const save = mutating(() => (open = false));
	// A deleted record disappears from its list at once.
	const remove = mutating(
		() => (open = false),
		(old, sent) => withRow(old, sent.get('id'), null)
	);
	let deleteForm = $state<HTMLFormElement>();
	const hasFile = $derived(fields.some((f) => f.type === 'image' || f.type === 'file'));
</script>

<Dialog side="end" bind:open title={item ? `Edit ${noun}` : `New ${noun}`}>
	{#if open}
		<form
			id="{uid}-form"
			method="post"
			action={saveAction}
			enctype={hasFile ? 'multipart/form-data' : undefined}
			class="app-form"
			onsubmit={save.submit}
		>
			{#if form?.code}<Alert tone="danger" title={message(form.code)} live />{/if}
			{#if item}<input type="hidden" name="id" value={String(item.id)} />{/if}
			{#each Object.entries(hidden) as [name, value] (name)}<input type="hidden" {name} {value} />{/each}
			<Fields {fields} item={item ?? defaults} values={form?.errors ? form.values : undefined} errors={form?.errors} />
		</form>
		{#if item}
			<form method="post" action={deleteAction} bind:this={deleteForm} onsubmit={remove.submit} hidden>
				<input type="hidden" name="id" value={String(item.id)} />
			</form>
		{/if}
		{@render children?.()}
	{/if}
	{#snippet footer()}
		<div class="foot">
			<div class="start">
				{#if item}
					<ConfirmButton onconfirm={() => deleteForm?.requestSubmit()} confirm="Delete for good?" done="Deleted">Delete</ConfirmButton>
				{/if}
				{@render actions?.()}
			</div>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" form="{uid}-form" loading={save.busy}>Save</Button>
		</div>
	{/snippet}
</Dialog>

<style>
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}
	.start {
		display: flex;
		gap: 0.5rem;
		margin-inline-end: auto;
	}
</style>
