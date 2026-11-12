<script lang="ts">
	import CourseCard from '#lib/components/CourseCard.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
</script>

<Seo
	title="English courses online | {data.settings.name}"
	description="All {data.settings.name} courses with fees and levels. Recorded lessons, live classes and a certificate when you finish."
/>

<PageTop crumb="Courses" title="Explore our courses" lede="Choose a course that meets your exact needs and start learning today." />

<section class="site-section tint">
	<div class="site-wrap">
		{#if data.courses.length}
			<div class="site-grid">
				{#each data.courses as course (course.slug)}<CourseCard {course} />{/each}
			</div>
		{:else}
			<p class="site-lede">Courses are being prepared. Check back soon.</p>
		{/if}
	</div>
</section>
