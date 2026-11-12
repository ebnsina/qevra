<script lang="ts">
	import { ArrowRight02Icon, BookOpen01Icon, Video01Icon } from '@hugeicons/core-free-icons';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import { money, plural } from '#lib/format.ts';
	import { levelTone } from '#lib/level.ts';

	interface Props {
		course: { slug: string; title: string; summary: string; level: string; price: number; image_key: string | null; enrollment_open: boolean; lessons: number };
	}
	let { course }: Props = $props();
</script>

<a class="site-card card" href="/courses/{course.slug}">
	<div class="cover">
		{#if course.image_key}
			<img src="/files/{course.image_key}" alt="" loading="lazy" width="800" height="419" />
		{:else}
			<Icon icon={BookOpen01Icon} size={40} />
		{/if}
	</div>
	<div class="body">
		<div class="meta">
			<Badge icon={false} tone={levelTone(course.level)}>{course.level || 'All levels'}</Badge>
			{#if course.enrollment_open}
				<span class="muted lessons"><Icon icon={Video01Icon} size={14} />{plural(course.lessons, 'lesson')}</span>
			{:else}
				<span class="muted lessons">Coming soon</span>
			{/if}
		</div>
		<h3 class="site-h3">{course.title}</h3>
		<p class="muted summary">{course.summary}</p>
		<p class="foot"><strong class="price">{course.enrollment_open ? money(course.price) : 'Coming soon'}</strong><span class="more">View course <Icon icon={ArrowRight02Icon} size={16} /></span></p>
	</div>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		text-decoration: none;
	}
	.cover {
		aspect-ratio: 40 / 21;
		background: var(--app-tint-strong);
		color: var(--ui-accent);
		display: grid;
		place-items: center;
		overflow: hidden;
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 400ms var(--ui-ease-out);
	}
	.card:hover .cover img {
		transform: scale(1.04);
	}
	.lessons {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-6);
	}
	.meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		font-size: var(--text-xs);
	}
	.summary {
		font-size: var(--text-sm);
	}
	.foot {
		margin-top: auto;
		padding-top: var(--space-4);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.price {
		font-size: var(--text-lg);
		font-weight: 700;
	}
	.more {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--ui-accent);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.more :global(svg) {
		transition: transform var(--ui-dur) var(--ui-ease-out);
	}
	.card:hover .more :global(svg) {
		transform: translateX(3px);
	}
	@media (prefers-reduced-motion: reduce) {
		.cover img,
		.more :global(svg) {
			transition: none;
		}
	}
</style>
