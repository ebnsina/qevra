<script lang="ts">
	import FileDrop from '#lib/sinaui/ui/FileDrop.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import ColorPicker from '#lib/sinaui/ui/ColorPicker.svelte';
	import CustomSelect from '#lib/sinaui/ui/CustomSelect.svelte';
	import Switch from '#lib/sinaui/ui/Switch.svelte';
	import Textarea from '#lib/sinaui/ui/Textarea.svelte';
	import DateTimeField from './DateTimeField.svelte';
	import RichField from './RichField.svelte';
	import { toLocalInput } from '#lib/format.ts';
	import type { Field, Item } from './fields.ts';

	interface Props {
		fields: Field[];
		/** The row being edited; empty for a new one. */
		item?: Item | null;
		/** What they typed, after the server rejected the form. */
		values?: Record<string, string>;
		errors?: Record<string, string>;
		/** Two columns for short fields (settings pages); one column in a sheet. */
		columns?: 1 | 2;
	}
	let { fields, item, values, errors, columns = 1 }: Props = $props();

	const IMAGE_TYPES = '.jpg,.jpeg,.png,.webp';
	const FILE_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';
	const MAX_BYTES = 4 * 1024 * 1024;

	function text(field: Field) {
		if (values && field.name in values) return values[field.name];
		const value = item?.[field.name];
		if (value == null) return '';
		if (field.type === 'datetime') return toLocalInput(value as Date);
		return String(value);
	}
	const wide = (field: Field) => field.wide || ['textarea', 'richtext', 'image', 'file', 'switch'].includes(field.type ?? 'text');
</script>

<div class={['fields', columns === 2 && 'two']}>
	{#each fields as field (field.name)}
		{@const key = item?.[field.name]}
		<div class={{ wide: wide(field) }}>
			{#if field.type === 'textarea'}
				<Textarea label={field.label} name={field.name} rows={field.rows ?? 4} required={field.required} hint={field.hint} placeholder={field.placeholder} value={text(field)} error={errors?.[field.name]} />
			{:else if field.type === 'richtext'}
				<RichField label={field.label} name={field.name} value={text(field)} hint={field.hint} error={errors?.[field.name]} />
			{:else if field.type === 'switch'}
				<Switch name={field.name} checked={Boolean(item?.[field.name])}>{field.label}</Switch>
				{#if field.hint}<p class="hint">{field.hint}</p>{/if}
			{:else if field.type === 'select'}
				<CustomSelect label={field.label} name={field.name} required={field.required} hint={field.hint} value={text(field)} error={errors?.[field.name]} options={field.options ?? []} />
			{:else if field.type === 'datetime'}
				<DateTimeField label={field.label} name={field.name} required={field.required} hint={field.hint} value={text(field)} error={errors?.[field.name]} />
			{:else if field.type === 'color'}
				<ColorPicker label={field.label} name={field.name} hint={field.hint} value={text(field)} />
			{:else if field.type === 'image' || field.type === 'file'}
				{#if typeof key === 'string' && key}
					{#if field.type === 'image'}
						<img class="current" src="/files/{key}" alt="Current {field.label.toLowerCase()}" />
					{:else}
						<p class="hint">Current file: <a href="/files/{key}">{String(item?.file_name ?? 'open')}</a></p>
					{/if}
				{/if}
				<FileDrop
					label={typeof key === 'string' && key ? `Replace ${field.label.toLowerCase()}` : field.label}
					name={field.name}
					accept={field.type === 'image' ? IMAGE_TYPES : FILE_TYPES}
					maxSize={MAX_BYTES}
					hint={field.hint ?? (field.type === 'image' ? 'JPG, PNG or WebP, up to 4 MB.' : 'PDF, Word or an image, up to 4 MB.')}
				/>
			{:else}
				<Input
					label={field.label}
					name={field.name}
					type={field.type === 'number' ? 'text' : (field.type ?? 'text')}
					inputmode={field.type === 'number' ? 'numeric' : undefined}
					required={field.required}
					hint={field.hint}
					placeholder={field.placeholder}
					value={text(field)}
					error={errors?.[field.name]}
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.fields {
		display: grid;
		gap: 1rem;
	}
	.fields.two {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
	}
	.two .wide {
		grid-column: 1 / -1;
	}
	@media (max-width: 40rem) {
		.fields.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.hint {
		margin-top: 0.25rem;
		color: var(--ui-muted);
		font-size: var(--text-xs);
	}
	.current {
		max-height: 7rem;
		border-radius: var(--ui-radius-control);
		margin-bottom: 0.5rem;
		background: var(--ui-subtle);
	}
</style>
