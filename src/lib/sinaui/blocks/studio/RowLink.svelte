<script lang="ts">
	// The cell that opens a table row's detail sheet: a real button, so keyboards and screen readers
	// reach it. Put it in the row's first cell.
	interface Props {
		label: string;
		onclick: () => void;
	}
	let { label, onclick }: Props = $props();
</script>

<button type="button" {onclick}>{label}</button>

<style>
	button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--ui-fg);
		font: inherit;
		font-weight: 550;
		text-align: start;
		cursor: pointer;
		text-decoration: underline;
		text-decoration-color: var(--ui-field-line);
		text-underline-offset: 0.25em;
	}
	button:hover {
		text-decoration-color: currentColor;
	}
	button:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}
</style>
