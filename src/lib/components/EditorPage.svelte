<script lang="ts" generics="T extends Item">
	// A full-page editor for one record, laid out like a publishing tool: the title and content in
	// the main column, and a publish box with the settings down the side.
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import ConfirmButton from '#lib/sinaui/ui/ConfirmButton.svelte';
	import { message } from '#lib/messages.ts';
	import { submitting } from '#lib/submitting.svelte.ts';
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
		/** The first side card: status switches, above the Save button. */
		publish: Field[];
		/** More side cards, each a titled group of settings. */
		side: { title: string; fields: Field[] }[];
		form?: { code?: string; errors?: Record<string, string>; values?: Record<string, string>; saved?: boolean } | null;
		/** More buttons beside Save for an existing record (View, Lessons). */
		actions?: Snippet<[T]>;
	}
	let { noun, back, item, defaults, main, publish, side, form, actions }: Props = $props();

	const save = submitting();
	let deleteForm = $state<HTMLFormElement>();
	const values = $derived(form?.errors ? form.values : undefined);
	const saved = $derived(form?.saved || page.url.searchParams.has('saved'));
	const name = $derived(String(item?.title ?? ''));
</script>

<div class="app-page editor">
	<PageHeader title={item ? name || `Edit ${noun}` : `New ${noun}`}>
		{#snippet actions()}<Button variant="outline" href={back.href}>{back.label}</Button>{/snippet}
	</PageHeader>

	{#if form?.code}<Alert tone="danger" title={message(form.code)} live />{/if}
	{#if form?.errors}<Alert tone="danger" title="Some fields need a look. They are marked below." live />{/if}
	{#if saved && !form?.code && !form?.errors}<Alert tone="success" title="Saved." live />{/if}

	<form method="post" action="?/save" enctype="multipart/form-data" class="columns" use:enhance={save.enhance}>
		<div class="main">
			<Card><Fields fields={main} item={item ?? defaults} {values} errors={form?.errors} /></Card>
		</div>

		<div class="side">
			<Card title="Publish" level={2}>
				<Fields fields={publish} item={item ?? defaults} {values} errors={form?.errors} />
				{#snippet footer()}
					<div class="publish">
						{#if item}
							<ConfirmButton size="sm" onconfirm={() => deleteForm?.requestSubmit()} confirm="Delete for good?" done="Deleted">Delete</ConfirmButton>
							{@render actions?.(item)}
						{/if}
						<Button type="submit" loading={save.busy}>{item ? 'Save' : `Create ${noun}`}</Button>
					</div>
				{/snippet}
			</Card>
			{#each side as group (group.title)}
				<Card title={group.title} level={2}>
					<Fields fields={group.fields} item={item ?? defaults} {values} errors={form?.errors} />
				</Card>
			{/each}
		</div>
	</form>
	{#if item}<form method="post" action="?/delete" bind:this={deleteForm} use:enhance hidden></form>{/if}
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
		top: 1rem;
	}
	.publish {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}
	.publish :global(:last-child) {
		margin-inline-start: auto;
	}
	@media (max-width: 64rem) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}
		.side {
			position: static;
		}
	}
</style>
