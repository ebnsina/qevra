<script lang="ts">
	import {
		Calendar03Icon,
		Certificate01Icon,
		CheckmarkCircle02Icon,
		PlayIcon,
		Quiz01Icon,
		Task01Icon,
		Tick02Icon,
		UserIcon,
		Video01Icon
	} from '@hugeicons/core-free-icons';
	import * as Accordion from '#lib/sinaui/ui/accordion/index.ts';
	import Avatar from '#lib/sinaui/ui/Avatar.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { money, plural } from '#lib/format.ts';
	import { levelTone } from '#lib/level.ts';

	let { data } = $props();
	const course = $derived(data.course);
	const counts = $derived(data.counts);
	let watching = $state(false);

	const includes = $derived(
		[
			{ icon: Video01Icon, text: plural(counts.lessons, 'recorded lesson'), show: counts.lessons > 0 },
			{ icon: Quiz01Icon, text: plural(counts.quizzes, 'quiz', 'quizzes'), show: counts.quizzes > 0 },
			{ icon: Task01Icon, text: `${plural(counts.assignments, 'assignment')} with teacher feedback`, show: counts.assignments > 0 },
			{ icon: Calendar03Icon, text: `${plural(counts.live, 'live class', 'live classes')} coming up`, show: counts.live > 0 },
			{ icon: Certificate01Icon, text: 'Certificate of completion', show: true }
		].filter((item) => item.show)
	);
	// Students already in the course keep their access even while enrollment is closed.
	const open = $derived(course.enrollment_open || data.enrolled);
	const enrollHref = $derived(data.enrolled ? `/portal/courses/${course.slug}` : `/portal/enroll/${course.slug}`);
	const enrollLabel = $derived(data.enrolled ? 'Continue learning' : course.price ? 'Enroll now' : 'Start for free');
</script>

<Seo
	title="{course.title} | {data.settings.name}"
	description={course.summary}
	image={course.image_key && `/files/${course.image_key}`}
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Course',
		name: course.title,
		description: course.summary,
		provider: { '@type': 'EducationalOrganization', name: data.settings.name },
		offers: { '@type': 'Offer', price: course.price, priceCurrency: 'BDT', category: course.price ? 'Paid' : 'Free' }
	}}
/>

<!-- Header band: what the course is and who teaches it. -->
<section class="band">
	<div class="site-wrap columns">
		<div class="intro">
			<nav aria-label="Breadcrumb" class="site-crumbs">
				<a href="/">Home</a><span aria-hidden="true">/</span><a href="/courses">Courses</a><span aria-hidden="true">/</span><span>{course.title}</span>
			</nav>
			<h1 class="site-h1">{course.title}</h1>
			<p class="summary">{course.summary}</p>
			<ul class="meta">
				<li><Badge icon={false} tone={levelTone(course.level)}>{course.level || 'All levels'}</Badge></li>
				{#if counts.lessons}<li><Icon icon={Video01Icon} size={16} />{plural(counts.lessons, 'lesson')}</li>{/if}
				{#if data.instructor}<li><Icon icon={UserIcon} size={16} /><span>Taught by <a href="#instructor">{data.instructor.name}</a></span></li>{/if}
			</ul>
		</div>
	</div>
</section>

<div class="site-wrap columns body">
	<div class="main">
		{#if data.outcomes.length}
			<section class="site-card">
				<h2 class="block-title">What you'll learn</h2>
				<ul class="outcomes">
					{#each data.outcomes as outcome (outcome)}
						<li><Icon icon={Tick02Icon} size={18} /><span>{outcome}</span></li>
					{/each}
				</ul>
			</section>
		{/if}

		<section>
			<h2 class="block-title">Course content</h2>
			{#if data.modules.length}
				<p class="muted count">{plural(data.modules.length, 'section')} · {plural(counts.lessons, 'lesson')}</p>
				<Accordion.Root>
					{#each data.modules as module, i (module.id)}
						<Accordion.Item title={module.title} description={plural(module.lessons.length, 'lesson')} open={i === 0}>
							<ol class="lessons">
								{#each module.lessons as lesson (lesson.id)}
									<li>
										<Icon icon={lesson.has_quiz ? Quiz01Icon : lesson.has_assignment ? Task01Icon : PlayIcon} size={16} />
										<span>{lesson.title}</span>
										{#if lesson.is_preview && data.preview}
											<Button size="xs" variant="link" onclick={() => (watching = true)}>Preview</Button>
										{/if}
									</li>
								{/each}
							</ol>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			{:else}
				<p class="muted">Lessons for this course are being added.</p>
			{/if}
		</section>

		{#if data.requirements.length}
			<section>
				<h2 class="block-title">Requirements</h2>
				<ul class="plain">
					{#each data.requirements as requirement (requirement)}<li>{requirement}</li>{/each}
				</ul>
			</section>
		{/if}

		{#if data.html}
			<section>
				<h2 class="block-title">Description</h2>
				<div class="prose">{@html data.html}</div>
			</section>
		{/if}

		{#if data.instructor}
			<section id="instructor">
				<h2 class="block-title">Instructor</h2>
				<div class="instructor">
					<Avatar name={data.instructor.name} size="lg" decorative />
					<div>
						<p><strong>{data.instructor.name}</strong></p>
						<p class="muted">{data.instructor.role}</p>
					</div>
				</div>
				<p class="muted bio">{data.instructor.text}</p>
			</section>
		{/if}
	</div>

	<!-- The enroll card stays in view while the page scrolls. -->
	<aside class="buy site-card">
		<div class="media">
			{#if course.image_key}<img src="/files/{course.image_key}" alt="" width="800" height="419" />{/if}
			{#if data.preview}
				<button type="button" class="watch" onclick={() => (watching = true)}>
					<span class="play"><Icon icon={PlayIcon} size={24} /></span>
					<span>Preview this course</span>
				</button>
			{/if}
		</div>
		<div class="buy-body">
			{#if open}
				<p class="price">{money(course.price)}</p>
				<Button size="lg" href={enrollHref}>{enrollLabel}</Button>
				{#if !data.enrolled && course.price > 0}<p class="muted small">Pay with bKash or Nagad. Access opens once we confirm it.</p>{/if}
			{:else}
				<p class="price">Coming soon</p>
				<p class="muted small">This course isn't open for enrollment yet.</p>
				<Button size="lg" variant="outline" href="/courses">See the courses you can join now</Button>
			{/if}
			<h2 class="includes-title">This course includes</h2>
			<ul class="includes">
				{#each includes as item (item.text)}
					<li><Icon icon={item.icon} size={18} /><span>{item.text}</span></li>
				{/each}
				<li><Icon icon={CheckmarkCircle02Icon} size={18} /><span>Access on phone and computer</span></li>
			</ul>
		</div>
	</aside>
</div>

<!-- On phones the price and enroll button stay at the bottom of the screen. -->
<div class="sticky-buy">
	{#if open}
		<p class="price">{money(course.price)}</p>
		<Button href={enrollHref}>{enrollLabel}</Button>
	{:else}
		<p class="price">Coming soon</p>
		<Button variant="outline" href="/courses">Other courses</Button>
	{/if}
</div>

{#if data.preview}
	<Dialog bind:open={watching} title={data.preview.title} description="Free preview lesson" class="preview-dialog">
		{#if watching}
			<div class="video">
				<iframe src={data.preview.src} title={data.preview.title} allow="fullscreen; picture-in-picture; autoplay" allowfullscreen></iframe>
			</div>
		{/if}
	</Dialog>
{/if}

<style>
	.band {
		background: var(--app-tint);
		padding-block: clamp(2.5rem, 6vw, 4rem);
	}
	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 22rem;
		gap: clamp(2rem, 5vw, 4rem);
		align-items: start;
	}
	.intro {
		display: grid;
		gap: var(--space-4);
	}
	.summary {
		font-size: var(--text-xl);
		max-width: 40rem;
	}
	.meta {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.25rem;
		font-size: var(--text-sm);
		color: var(--ui-muted);
	}
	.meta li {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.meta a {
		color: var(--ui-accent);
		font-weight: 600;
	}

	.body {
		padding-block: var(--space-12) var(--space-section);
	}
	.main {
		display: grid;
		gap: var(--space-12);
		min-width: 0;
	}
	.block-title {
		font-size: var(--text-2xl);
		margin-bottom: var(--space-4);
	}
	.count {
		font-size: var(--text-sm);
		margin: -0.5rem 0 var(--space-3);
	}
	.outcomes {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: 0.75rem 2rem;
	}
	.outcomes li,
	.includes li,
	.lessons li {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
	}
	.outcomes :global(svg),
	.includes :global(svg),
	.lessons :global(svg) {
		flex: none;
		margin-top: 0.25rem;
		color: var(--ui-accent);
	}
	.lessons {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
		font-size: var(--text-sm);
	}
	.lessons span {
		flex: 1;
	}
	.plain {
		margin: 0;
		padding-inline-start: 1.25rem;
		display: grid;
		gap: 0.4rem;
	}
	.instructor {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}
	.bio {
		max-width: 40rem;
	}

	.buy {
		position: sticky;
		top: 5.5rem;
		/* Pulled up so it overlaps the header band, like a storefront card. */
		margin-top: calc(-1 * clamp(9rem, 16vw, 13rem));
		padding: 0;
		overflow: hidden;
		box-shadow: var(--ui-shadow-overlay);
	}
	.media {
		position: relative;
		aspect-ratio: 40 / 21;
		background: var(--app-tint-strong);
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.watch {
		all: unset;
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 0.5rem;
		cursor: pointer;
		background: rgb(0 0 0 / 0.4);
		color: #ffffff;
		font-weight: 600;
		font-size: var(--text-sm);
	}
	.watch:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: calc(-1 * var(--ui-ring-width));
	}
	.play {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: #ffffff;
		color: #0f0f10;
	}
	.buy-body {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-6);
	}
	.price {
		font-family: var(--ui-font-heading);
		font-size: 2rem;
		font-weight: 600;
		line-height: 1.1;
	}
	.small {
		font-size: var(--text-xs);
	}
	.includes-title {
		font-family: var(--ui-font);
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: 0;
		margin-top: var(--space-2);
	}
	.includes {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
		font-size: var(--text-sm);
	}

	.sticky-buy {
		display: none;
	}
	@media (max-width: 60rem) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}
		.buy {
			position: static;
			margin-top: 0;
			order: -1;
		}
		.body {
			padding-bottom: 7rem;
		}
		.sticky-buy {
			position: fixed;
			inset: auto 0 0;
			z-index: 6;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			padding: 0.75rem var(--app-gutter) calc(0.75rem + env(safe-area-inset-bottom));
			background: var(--ui-surface);
			box-shadow: 0 -1px 0 var(--ui-line);
		}
		.sticky-buy .price {
			font-size: var(--text-2xl);
		}
	}

	.video {
		aspect-ratio: 16 / 9;
		width: min(80vw, 48rem);
		max-width: 100%;
		border-radius: var(--ui-radius);
		overflow: hidden;
		background: #0f0f10;
	}
	.video iframe {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
	}
</style>
