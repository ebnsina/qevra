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
		border-radius: calc(var(--ui-radius) + 0.5rem);
		background: var(--ui-accent);
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
