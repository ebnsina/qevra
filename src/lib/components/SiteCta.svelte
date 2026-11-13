<script lang="ts">
	// The band that closes a public page with one next step.
	import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';

	interface Props {
		title: string;
		text: string;
		href?: string;
		label?: string;
	}
	let { title, text, href = '/contact', label = "Let's talk" }: Props = $props();
</script>

<section class="site-section">
	<div class="site-wrap">
		<div class="band reveal">
			<div>
				<h2 class="site-h2">{title}</h2>
				<p>{text}</p>
			</div>
			<Button size="lg" variant="secondary" {href}>{label} <Icon icon={ArrowRight02Icon} /></Button>
		</div>
	</div>
</section>

<style>
	.band {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem 3rem;
		padding: clamp(2rem, 5vw, 3.5rem);
		border-radius: var(--radius-xl);
		/* Aurora: clouds of lighter and deeper blue over the brand color. */
		background:
			radial-gradient(60% 120% at 12% 0%, color-mix(in oklab, var(--ui-accent) 55%, #22d3ee) 0%, transparent 60%),
			radial-gradient(50% 110% at 88% 100%, color-mix(in oklab, var(--ui-accent) 60%, #a5b4fc) 0%, transparent 62%),
			radial-gradient(45% 90% at 60% 10%, color-mix(in oklab, var(--ui-accent) 70%, #1e3a8a) 0%, transparent 65%),
			var(--ui-accent);
		color: var(--ui-on-accent);
	}
	.band :global(.site-h2) {
		margin-top: 0;
	}
	.band p {
		font-size: var(--text-lg);
		max-width: 36rem;
	}
</style>
