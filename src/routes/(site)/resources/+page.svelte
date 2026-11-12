<script lang="ts">
	import { Download01Icon, File01Icon } from '@hugeicons/core-free-icons';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SiteCta from '#lib/components/SiteCta.svelte';

	let { data } = $props();
	const kind = (name: string) => name.split('.').pop()!.toUpperCase();
</script>

<Seo
	title="Free English study resources | {data.settings.name}"
	description="Word lists, verb tables and study sheets from {data.settings.name}. Free to download, no account needed."
/>

<PageTop
	crumb="Resources"
	title="Free study resources"
	lede="Word lists and study sheets you can download and keep. No account needed."
	facts={data.resources.length
		? [
				{ value: String(data.resources.length), label: data.resources.length === 1 ? 'study sheet' : 'study sheets' },
				{ value: 'Free', label: 'to download and print' },
				{ value: 'No', label: 'account needed' }
			]
		: []}
/>

<section class="site-section tint">
	<div class="site-wrap">
		{#if data.resources.length}
			<ul class="site-grid">
				{#each data.resources as resource (resource.id)}
					<li class="site-card sheet">
						<div class="card-head">
							<h2 class="site-h3">{resource.title}</h2>
							<span class="app-icon"><Icon icon={File01Icon} size={20} /></span>
						</div>
						<p class="muted">{resource.description}</p>
						<div class="foot">
							<Badge icon={false}>{kind(resource.file_name)}</Badge>
							<Button variant="outline" href="/files/{resource.file_key}" download={resource.file_name}>
								<Icon icon={Download01Icon} /> Download
							</Button>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="site-lede">Nothing here yet. New material is added with each course.</p>
		{/if}
	</div>
</section>

<SiteCta title={data.closing.title} text={data.closing.text} href="/courses" label="See our courses" />

<style>
	.sheet {
		display: flex;
		flex-direction: column;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-top: auto;
		padding-top: var(--space-6);
	}
</style>
