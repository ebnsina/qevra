<script lang="ts">
	import Button from '#lib/sinaui/ui/Button.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data } = $props();
	const post = $derived(data.post);
</script>

<Seo
	title="{post.title} | {data.settings.name}"
	description={post.excerpt}
	image={post.image_key && `/files/${post.image_key}`}
	jsonLd={{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, datePublished: post.published_at }}
/>

<PageTop crumb="Blog" title={post.title} lede={post.excerpt}>
	<p class="muted date">{date(post.published_at)}</p>
</PageTop>

<article class="site-section">
	<div class="site-wrap article">
		{#if post.image_key}<img class="cover" src="/files/{post.image_key}" alt="" />{/if}
		<div class="prose">{@html data.html}</div>
		<div><Button variant="outline" href="/courses">See our courses</Button></div>
	</div>
</article>

<style>
	.date {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
	}
	.article {
		display: grid;
		gap: var(--space-8);
		max-width: 50rem;
	}
	.cover {
		width: 100%;
		border-radius: calc(var(--ui-radius) + 0.25rem);
	}
</style>
