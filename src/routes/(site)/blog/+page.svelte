<script lang="ts">
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data } = $props();
</script>

<Seo
	title="Blog | {data.settings.name}"
	description="Short, practical posts on speaking, writing and studying English from {data.settings.name}."
/>

<PageTop crumb="Blog" title="Read our blog" lede="Short reads to practise your English and pick up a new habit." />

<section class="site-section tint">
	<div class="site-wrap">
		{#if data.posts.length}
			<div class="site-grid">
				{#each data.posts as post (post.slug)}
					<a class="site-card post" href="/blog/{post.slug}">
						{#if post.image_key}<img src="/files/{post.image_key}" alt="" loading="lazy" />{/if}
						<div>
							<p class="muted date">{date(post.published_at)}</p>
							<h2 class="site-h3">{post.title}</h2>
							<p class="muted">{post.excerpt}</p>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<p class="site-lede">No posts yet. The first one is on its way.</p>
		{/if}
	</div>
</section>

<style>
	.post {
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		text-decoration: none;
	}
	.post img {
		aspect-ratio: 40 / 21;
		width: 100%;
		object-fit: cover;
	}
	.post div {
		display: grid;
		gap: 0.5rem;
		padding: 1.5rem;
	}
	.date {
		font-size: var(--text-xs);
	}
	.post:hover h2 {
		color: var(--ui-accent);
	}
</style>
