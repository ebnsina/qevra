<script lang="ts">
	import PageTop from '#lib/components/PageTop.svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SiteCta from '#lib/components/SiteCta.svelte';

	let { data } = $props();
	const [latest, ...older] = $derived(data.posts);
</script>

<Seo
	title="Blog | {data.settings.name}"
	description="Short, practical posts on speaking, writing and studying English from {data.settings.name}."
/>

<PageTop crumb="Blog" title="Read our blog" lede="Short reads to practise your English and pick up a new habit." />

<section class="site-section tint">
	<div class="site-wrap stack">
		{#if latest}
			<PostCard post={latest} featured />
			{#if older.length}
				<div class="site-grid">
					{#each older as post (post.slug)}<PostCard {post} />{/each}
				</div>
			{/if}
		{:else}
			<p class="site-lede">No posts yet. The first one is on its way.</p>
		{/if}
	</div>
</section>

<SiteCta title={data.closing.title} text={data.closing.text} />

<style>
	.stack {
		display: grid;
		gap: var(--app-gap);
	}
</style>
