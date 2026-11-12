<script lang="ts">
	import { QuoteUpIcon } from '@hugeicons/core-free-icons';
	import Avatar from '#lib/sinaui/ui/Avatar.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SiteCta from '#lib/components/SiteCta.svelte';

	let { data } = $props();
	const average = $derived(data.reviews.reduce((sum, r) => sum + r.rating, 0) / (data.reviews.length || 1));
</script>

<Seo
	title="Student reviews | {data.settings.name}"
	description="What students say about learning English with {data.settings.name}, in their own words."
/>

<PageTop
	crumb="Reviews"
	title="Students' feedback"
	lede="What our students say after finishing a course."
	facts={data.reviews.length
		? [
				{ value: `★ ${average.toFixed(1)}`, label: 'average out of 5' },
				{ value: String(data.reviews.length), label: data.reviews.length === 1 ? 'student story' : 'student stories' }
			]
		: []}
/>

<section class="site-section tint">
	<div class="site-wrap">
		{#if data.reviews.length}
			<ul class="wall">
				{#each data.reviews as review (review.id)}
					<li class="site-card review">
						<div class="top">
							<span class="quote"><Icon icon={QuoteUpIcon} size={22} /></span>
							<span class="stars" role="img" aria-label="{review.rating} out of 5">{'★'.repeat(review.rating)}</span>
						</div>
						<blockquote>{review.body}</blockquote>
						<p class="who">
							<Avatar name={review.name} decorative />
							<span><strong>{review.name}</strong><span class="muted">{review.affiliation}</span></span>
						</p>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="site-lede">No reviews yet. Finish a course and yours could be the first.</p>
		{/if}
	</div>
</section>

<SiteCta title={data.closing.title} text={data.closing.text} href="/courses" label="See our courses" />

<style>
	/* Columns, not a grid: long and short reviews pack together without gaps. */
	.wall {
		list-style: none;
		margin: 0;
		padding: 0;
		columns: 3 19rem;
		column-gap: var(--app-gap);
	}
	.review {
		display: grid;
		gap: var(--space-4);
		margin-bottom: var(--app-gap);
		break-inside: avoid;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.quote,
	.stars {
		color: var(--ui-accent);
	}
	.stars {
		letter-spacing: 0.15em;
	}
	blockquote {
		margin: 0;
		font-size: var(--text-lg);
		line-height: 1.55;
	}
	.who {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-top: var(--space-4);
		border-top: 1px solid var(--ui-line);
		font-size: var(--text-sm);
	}
	.who > span {
		display: grid;
	}
</style>
