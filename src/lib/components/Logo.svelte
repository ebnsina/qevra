<script lang="ts">
	// The academy's logo image when one is uploaded, otherwise its name as a wordmark.
	interface Props {
		name: string;
		logoKey: string;
		href?: string;
	}
	let { name, logoKey, href = '/' }: Props = $props();
</script>

<a class="logo" {href}>
	{#if logoKey}
		<img src="/files/{logoKey}" alt={name} />
	{:else}
		<span>{name}</span>
	{/if}
</a>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}
	img {
		height: 2.5rem;
		width: auto;
	}
	span {
		font-family: var(--ui-font-heading);
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: 0.01em;
	}
	/* shortcut: assumes a dark, single-color logo and flips it on the dark theme;
	   add a separate dark-theme logo upload when an academy has a colored one. */
	:global(:root[data-theme='dark']) img {
		filter: invert(1);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) img {
			filter: invert(1);
		}
	}
</style>
