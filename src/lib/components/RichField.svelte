<script lang="ts">
	// A rich text editor that sends its content with the form, as HTML.
	import RichTextEditor from '#lib/sinaui/ui/RichTextEditor.svelte';

	interface Props {
		label: string;
		name: string;
		/** The starting content, as HTML. */
		value: string;
		hint?: string;
		error?: string;
	}
	let { label, name, value, hint, error }: Props = $props();
	// svelte-ignore state_referenced_locally
	let html = $state(value);
</script>

<div class="rich">
	<RichTextEditor {label} bind:html placeholder="Start writing…" />
	<input type="hidden" {name} value={html} />
	{#if error}<p class="error" role="alert">{error}</p>{:else if hint}<p class="hint">{hint}</p>{/if}
</div>

<style>
	.rich {
		display: grid;
		gap: 0.375rem;
	}
	/* Room to write: the editor grows with the text from a tall start. */
	.rich :global(.ProseMirror) {
		min-height: 22rem;
	}
	.hint,
	.error {
		font-size: 0.8125rem;
		color: var(--ui-muted);
	}
	.error {
		color: var(--ui-danger);
	}
</style>
