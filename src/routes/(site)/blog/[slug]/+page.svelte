<script lang="ts">
	import PageTop from '#lib/components/PageTop.svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SiteCta from '#lib/components/SiteCta.svelte';
	import { date, plural } from '#lib/format.ts';

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
	<p class="muted meta">{date(post.published_at)} · {plural(post.minutes, 'minute')} to read · {data.settings.name}</p>
</PageTop>

<article class="site-section">
	<div class="site-wrap article">
		{#if post.image_key}<img class="cover" src="/files/{post.image_key}" alt="" width="800" height="420" />{/if}
		<div class="prose">{@html data.html}</div>
	</div>
</article>

{#if data.more.length}
	<section class="site-section tint">
		<div class="site-wrap">
			<div class="site-head row reveal">
				<h2 class="site-h2">Keep reading</h2>
				<a class="all" href="/blog">All posts →</a>
			</div>
			<div class="site-grid">
				{#each data.more as item (item.slug)}<PostCard post={item} />{/each}
			</div>
		</div>
	</section>
{/if}

<SiteCta title={data.closing.title} text={data.closing.text} />

<style>
	.meta {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
	}
	.article {
		display: grid;
		gap: var(--space-8);
		max-width: 48rem;
	}
	.cover {
		width: 100%;
		height: auto;
		border-radius: calc(var(--ui-radius) + 0.25rem);
		box-shadow: var(--ui-shadow-xs);
	}
	.article .prose {
		font-size: var(--text-lg);
	}
	.all {
		color: var(--ui-accent);
		font-weight: 600;
		text-decoration: none;
	}
</style>
