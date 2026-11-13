<script lang="ts">
	// A thin bar across the top while the next page loads, so a click never looks ignored.
	import { navigating } from '$app/state';
</script>

{#if navigating.to}
	<div class="bar" role="progressbar" aria-label="Loading page"></div>
{/if}

<style>
	.bar {
		position: fixed;
		inset: 0 0 auto;
		z-index: 1000;
		height: 3px;
		background: var(--brand);
		transform-origin: left;
		/* Starts after 120ms so fast pages show nothing, then creeps towards the end without reaching it. */
		animation: creep 8s cubic-bezier(0.1, 0.8, 0.2, 1) 120ms both;
	}
	:global([dir='rtl']) .bar {
		transform-origin: right;
	}
	@keyframes creep {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(0.92);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bar {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
