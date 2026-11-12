<script lang="ts">
	import { Download01Icon, File01Icon } from '@hugeicons/core-free-icons';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
</script>

<Seo
	title="Free English study resources | {data.settings.name}"
	description="Word lists, verb tables and study sheets from {data.settings.name}. Free to download, no account needed."
/>

<PageTop crumb="Resources" title="Free study resources" lede="Word lists and study sheets you can download and keep. No account needed." />

<section class="site-section tint">
	<div class="site-wrap">
		{#if data.resources.length}
			<ul class="site-card rows">
				{#each data.resources as resource (resource.id)}
					<li>
						<span class="app-icon"><Icon icon={File01Icon} size={20} /></span>
						<div>
							<h2 class="site-h3">{resource.title}</h2>
							<p class="muted">{resource.description}</p>
						</div>
						<Button variant="outline" href="/files/{resource.file_key}" download={resource.file_name}>
							<Icon icon={Download01Icon} /> Download
						</Button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="site-lede">Nothing here yet. New material is added with each course.</p>
		{/if}
	</div>
</section>

<style>
	.rows {
		list-style: none;
		margin: 0;
		padding-block: 0.5rem;
	}
	.rows li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
		padding-block: 1rem;
	}
	.rows li + li {
		border-top: 1px solid var(--ui-line);
	}
	@media (max-width: 40rem) {
		.rows li {
			grid-template-columns: auto 1fr;
		}
	}
</style>
