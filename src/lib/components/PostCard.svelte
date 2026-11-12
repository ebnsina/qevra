<script lang="ts">
	// A blog post as a card: cover, date, reading time, title and excerpt.
	import { date, plural } from '#lib/format.ts';

	interface Props {
		post: { slug: string; title: string; excerpt: string; image_key: string | null; published_at: Date; minutes: number };
		/** The newest post, shown wide with the cover beside the text. */
		featured?: boolean;
	}
	let { post, featured = false }: Props = $props();
</script>

<a class="site-card post" class:featured href="/blog/{post.slug}">
	{#if post.image_key}<img src="/files/{post.image_key}" alt="" loading={featured ? 'eager' : 'lazy'} width="800" height="420" />{/if}
	<div class="text">
		<p class="muted meta">{#if featured}<span class="new">Latest</span>{/if}{date(post.published_at)} · {plural(post.minutes, 'minute')} to read</p>
		{#if featured}<h2 class="site-h2">{post.title}</h2>{:else}<h3 class="site-h3">{post.title}</h3>{/if}
		<p class="muted">{post.excerpt}</p>
		<span class="more">Read the post →</span>
	</div>
</a>

<style>
	.post {
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		text-decoration: none;
	}
	img {
		aspect-ratio: 40 / 21;
		width: 100%;
		height: auto;
		object-fit: cover;
	}
	.text {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-6);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-xs);
	}
	.new {
		padding: 0.15rem 0.6rem;
		border-radius: 99px;
		background: var(--ui-accent);
		color: var(--ui-on-accent);
		font-weight: 600;
	}
	.more {
		margin-top: auto;
		padding-top: var(--space-3);
		color: var(--ui-accent);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.post:hover :is(h2, h3) {
		color: var(--ui-accent);
	}
	.featured .site-h2 {
		margin-block: 0;
	}
	@media (min-width: 48rem) {
		.featured {
			display: grid;
			grid-template-columns: 1.1fr 1fr;
		}
		.featured img {
			height: 100%;
		}
		.featured .text {
			justify-content: center;
			padding: clamp(1.5rem, 4vw, 3rem);
		}
		.featured .more {
			margin-top: 0;
		}
	}
</style>
