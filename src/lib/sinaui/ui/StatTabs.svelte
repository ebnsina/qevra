<script lang="ts">
	import { untrack } from 'svelte';
	import {
		ArrowDownRight01Icon,
		ArrowUpRight01Icon,
		MinusSignIcon
	} from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import RollingNumber from './RollingNumber.svelte';

	interface Item {
		value: string;
		/** What's measured ("Calls"). */
		label: string;
		/** The number as shown ("1,284"); format it with Intl. */
		display: string;
		/** How it moved, worded to read on its own ("+12% on last week"); shown small under the number. */
		change?: string;
		/** Which way it moved, drawn as an arrow beside the change. Not a judgment: no color. */
		trend?: 'up' | 'down' | 'flat';
	}

	interface Props {
		/** Names the group ("Chart metric"). */
		label: string;
		items: Item[];
		/** The chosen metric; the chart below shows it. */
		value?: string;
		name?: string;
		class?: string;
	}

	const uid = $props.id();
	let { label, items, value = $bindable(), name = uid, class: className }: Props = $props();
	const arrows = { up: ArrowUpRight01Icon, down: ArrowDownRight01Icon, flat: MinusSignIcon };
	// Unset: the first metric is chosen in the server HTML already.
	untrack(() => {
		if (value === undefined) value = items[0]?.value;
	});
</script>

<!-- Native radios: one Tab stop, arrow keys choose, works before hydration. -->
<div class={['stat-tabs', className]}>
	<div class="row" role="radiogroup" aria-label={label}>
		{#each items as item (item.value)}
			<label class="cell">
				<input type="radio" {name} value={item.value} bind:group={value} />
				<span class="label">{item.label}</span>
				<!-- Rolls to a new number, so a changed period or filter shows where the figures moved. -->
				<span class="value"><RollingNumber value={item.display} duration={400} /></span>
				{#if item.change}
					<span class="change">
						{#if item.trend}<Icon icon={arrows[item.trend]} size={14} />{/if}
						<span>{item.change}</span>
					</span>
				{/if}
			</label>
		{/each}
	</div>
</div>

<style>
	/* Measured by its own width, so it lays out the same in a card, a column or a full page. */
	.stat-tabs {
		container-type: inline-size;
		color: var(--ui-fg);
		font: var(--ui-font-size)/1.4 var(--ui-font);
	}
	.row {
		display: grid;
		grid-auto-columns: minmax(0, 1fr);
		grid-auto-flow: column;
	}
	.cell {
		position: relative;
		display: grid;
		/* Top-aligned, so a number without a change lines up with the ones beside it. */
		align-content: start;
		gap: 0.25rem;
		min-inline-size: 0;
		padding: 1rem;
		border-block-end: 1px solid var(--ui-field-line);
		background: var(--ui-faint);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: background-color var(--ui-dur-press) ease;
	}
	.cell + .cell {
		border-inline-start: 1px solid var(--ui-line);
	}
	@media (hover: hover) and (pointer: fine) {
		.cell:hover {
			background: var(--ui-subtle);
		}
	}
	.cell:has(input:checked) {
		background: var(--ui-surface);
		box-shadow: inset 0 -1.5px var(--ui-accent);
		border-block-end-color: transparent;
	}
	/* The radio stays for keyboard and screen readers; the cell is what you see and press. */
	input {
		position: absolute;
		inset: 0;
		margin: 0;
		opacity: 0;
		cursor: inherit;
	}
	.cell:has(input:focus-visible) {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: calc(-1 * var(--ui-ring-width));
	}
	.label {
		overflow: hidden;
		color: var(--ui-muted);
		font-size: 0.8125rem;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.value {
		overflow: hidden;
		font-size: 1.125rem;
		font-weight: 500;
		letter-spacing: -0.045px;
		font-variant-numeric: tabular-nums;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.change {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		min-inline-size: 0;
		color: var(--ui-muted);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	.change :global(svg) {
		flex: none;
	}
	.change span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* Narrow: two to a row instead of squeezing. */
	@container (width < 32rem) {
		.row {
			grid-auto-flow: row;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.cell:nth-child(odd) {
			border-inline-start: 0;
		}
	}
	@media (forced-colors: active) {
		.cell:has(input:checked) {
			outline: 2px solid Highlight;
			outline-offset: -2px;
		}
	}
</style>
