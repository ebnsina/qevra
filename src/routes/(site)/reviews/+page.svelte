<script lang="ts">
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
</script>

<Seo
	title="Student reviews | {data.settings.name}"
	description="What students say about learning English with {data.settings.name}, in their own words."
/>

<PageTop crumb="Reviews" title="Students' feedback" lede="What our students say after finishing a course." />

<section class="site-section tint">
	<div class="site-wrap">
		{#if data.reviews.length}
			<ul class="site-grid">
				{#each data.reviews as review (review.id)}
					<li class="site-card review">
						<p class="stars" aria-label="{review.rating} out of 5">{'★'.repeat(review.rating)}</p>
						<blockquote>{review.body}</blockquote>
						<p class="who"><strong>{review.name}</strong><span class="muted">{review.affiliation}</span></p>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="site-lede">No reviews yet. Finish a course and yours could be the first.</p>
		{/if}
	</div>
</section>

<style>
	.review {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	blockquote {
		margin: 0;
		font-size: var(--text-lg);
		line-height: 1.55;
	}
	.who {
		display: grid;
		margin-top: auto;
		padding-top: 0.5rem;
		font-size: var(--text-sm);
	}
	.stars {
		color: var(--ui-accent);
		letter-spacing: 0.15em;
	}
</style>
