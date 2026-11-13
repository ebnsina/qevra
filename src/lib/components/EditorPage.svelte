<script lang="ts" generics="T extends Item">
	// A full-page editor for one record, laid out like a publishing tool: the title and content in
	// the main column, and a publish box with the settings down the side.
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import ConfirmButton from '#lib/sinaui/ui/ConfirmButton.svelte';
	import { message } from '#lib/messages.ts';
	import { mutating } from '#lib/admin-query.svelte.ts';
	import Fields from './Fields.svelte';
	import type { Field, Item } from './fields.ts';

	interface Props {
		/** What one of these is called: "post", "course". */
		noun: string;
		/** The list this record belongs to. */
		back: { href: string; label: string };
		/** The record being edited, or null to write a new one. */
		item: T | null;
		/** Starting values for a new record. */
		defaults?: Item;
		/** The big fields: title and content. */
		main: Field[];
		/** The first side card: status switches. */
		publish: Field[];
		/** More side cards, each a titled group of settings. */
		side: { title: string; fields: Field[] }[];
		form?: { code?: string; errors?: Record<string, string>; values?: Record<string, string>; saved?: boolean } | null;
		/** More buttons beside Save, in the page header, for an existing record (View, Lessons). */
		actions?: Snippet<[T]>;
	}
	let { noun, back, item, defaults, main, publish, side, form, actions: extra }: Props = $props();

	const save = mutating();
	const remove = mutating();
	let deleteForm = $state<HTMLFormElement>();
	const values = $derived(form?.errors ? form.values : undefined);
	const saved = $derived(form?.saved || page.url.searchParams.has('saved'));
	const name = $derived(String(item?.title ?? ''));
</script>

<div class="app-page editor">
	<div class="head">
	<PageHeader title={item ? name || `Edit ${noun}` : `New ${noun}`}>
		{#snippet actions()}
			<Button variant="ghost" href={back.href}>{back.label}</Button>
			{#if item}
				<ConfirmButton onconfirm={() => deleteForm?.requestSubmit()} confirm="Delete for good?" done="Deleted">Delete</ConfirmButton>
				{@render extra?.(item)}
			{/if}
			<Button type="submit" form="editor-form" loading={save.busy}>{item ? 'Save' : `Create ${noun}`}</Button>
		{/snippet}
	</PageHeader>
	</div>

	{#if form?.code}<Alert tone="danger" title={message(form.code)} live />{/if}
	{#if form?.errors}<Alert tone="danger" title="Some fields need a look. They are marked below." live />{/if}
	{#if saved && !form?.code && !form?.errors}<Alert tone="success" title="Saved." live />{/if}

	<form method="post" action="?/save" enctype="multipart/form-data" id="editor-form" class="columns" onsubmit={save.submit}>
		<div class="main">
			<Card><Fields fields={main} item={item ?? defaults} {values} errors={form?.errors} /></Card>
		</div>

		<div class="side">
			<Card title="Publish" level={2}>
				<Fields fields={publish} item={item ?? defaults} {values} errors={form?.errors} />
			</Card>
			{#each side as group (group.title)}
				<Card title={group.title} level={2}>
					<Fields fields={group.fields} item={item ?? defaults} {values} errors={form?.errors} />
				</Card>
			{/each}
		</div>
	</form>
	{#if item}<form method="post" action="?/delete" bind:this={deleteForm} onsubmit={remove.submit} hidden></form>{/if}
</div>

<style>
	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 21rem;
		gap: var(--app-gap);
		align-items: start;
	}
	.main,
	.side {
		display: grid;
		gap: var(--app-gap);
		min-width: 0;
	}
	/* The publish box and settings stay in view while a long text scrolls. */
	.side {
		position: sticky;
		top: 5.5rem;
	}
	/* Save, View and Delete stay in reach while a long text scrolls: the header covers the page's own padding. */
	.head {
		--pad: clamp(1rem, 3vw, 2rem);
		position: sticky;
		top: 0;
		z-index: 5;
		margin: calc(-1 * var(--pad)) calc(-1 * var(--pad)) 0;
		padding: var(--pad) var(--pad) 0.75rem;
		background: var(--ui-bg);
	}
	@media (max-width: 64rem) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}
		.side,
		.head {
			position: static;
		}
	}
</style>
