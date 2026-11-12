<script lang="ts">
	import Segmented from '#lib/sinaui/ui/Segmented.svelte';
	import CourseCard from '#lib/components/CourseCard.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SiteCta from '#lib/components/SiteCta.svelte';
	import { plural } from '#lib/format.ts';

	type Course = (typeof data.courses)[number];
	let { data } = $props();

	const filters: { value: string; label: string; test: (c: Course) => boolean }[] = [
		{ value: 'all', label: 'All', test: () => true },
		{ value: 'open', label: 'Open now', test: (c) => c.enrollment_open },
		{ value: 'free', label: 'Free', test: (c) => c.enrollment_open && c.price === 0 },
		{ value: 'soon', label: 'Coming soon', test: (c) => !c.enrollment_open }
	];
	const count = (value: string) => data.courses.filter(filters.find((f) => f.value === value)!.test).length;
	// Only the choices that would show something.
	const options = $derived(filters.filter((f) => count(f.value)).map(({ value, label }) => ({ value, label })));
	let filter = $state('all');
	const test = $derived(filters.find((f) => f.value === filter)!.test);
</script>

<Seo
	title="English courses online | {data.settings.name}"
	description="All {data.settings.name} courses with fees and levels. Recorded lessons, live classes and a certificate when you finish."
/>

<PageTop
	crumb="Courses"
	title="Explore our courses"
	lede="Choose a course that meets your exact needs and start learning today."
	facts={data.courses.length
		? [
				{ value: String(data.courses.length), label: data.courses.length === 1 ? 'course' : 'courses' },
				{ value: String(count('open')), label: 'open to join now' },
				{ value: String(count('free')), label: 'free to take' }
			]
		: []}
/>

<section class="site-section tint">
	<div class="site-wrap">
		{#if data.courses.length}
			<div class="bar">
				<p class="muted" aria-live="polite">Showing {plural(count(filter), 'course')}</p>
				{#if options.length > 2}<Segmented label="Show" hideLabel {options} bind:value={filter} />{/if}
			</div>
			<!-- Hidden rather than removed, so a card that has already faded in stays as it is. -->
			<div class="site-grid">
				{#each data.courses as course (course.slug)}
					<div class="cell" hidden={!test(course)}><CourseCard {course} /></div>
				{/each}
			</div>
		{:else}
			<p class="site-lede">Courses are being prepared. Check back soon.</p>
		{/if}
	</div>
</section>

<SiteCta title={data.closing.title} text={data.closing.text} />

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3) var(--space-6);
		margin-bottom: var(--space-6);
	}
	.bar :global(> :last-child) {
		max-width: 100%;
		overflow-x: auto;
	}
	.cell:not([hidden]) {
		display: grid;
	}
</style>
