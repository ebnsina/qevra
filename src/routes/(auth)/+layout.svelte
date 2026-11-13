<script lang="ts">
	import Logo from '#lib/components/Logo.svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="preload" as="image" href="/images/auth.webp" type="image/webp" media="(min-width: 64rem)" />
</svelte:head>

<div class="auth">
	<div class="side">
		<Logo name={data.settings.name} logoKey={data.settings.logo_key} />
		<main>{@render children()}</main>
	</div>
	<!-- Decoration only, on wide screens: a CSS background, so phones never download it. -->
	<div class="photo" aria-hidden="true">
		{#if data.settings.tagline}<p>{data.settings.tagline}</p>{/if}
	</div>
</div>

<style>
	.auth {
		min-height: 100dvh;
		display: grid;
	}
	.side {
		display: grid;
		align-content: center;
		justify-items: center;
		gap: 1.5rem;
		padding: 2rem 1rem;
		background: radial-gradient(60rem 28rem at 50% -6rem, var(--app-tint-strong), transparent 70%), var(--ui-bg);
	}
	main {
		width: min(100%, 26rem);
	}
	.photo {
		display: none;
	}
	@media (min-width: 64rem) {
		.auth {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
		.photo {
			display: flex;
			align-items: flex-end;
			margin: 1rem;
			padding: 2.5rem;
			border-radius: var(--radius-xl);
			/* Photo from Unsplash (photo-1523240795612-9a054b0db644), 1100 x 1400 WebP, darkened at the foot for the text. */
			background:
				linear-gradient(180deg, transparent 45%, color-mix(in oklab, var(--ui-accent) 55%, #0b1020) 100%),
				url('/images/auth.webp') center / cover no-repeat,
				#b9b3a8;
			color: #fff;
		}
		.photo p {
			max-width: 22rem;
			font-family: var(--ui-font-heading);
			font-size: var(--text-h2);
			font-weight: 700;
			line-height: 1.15;
			letter-spacing: -0.02em;
			text-wrap: balance;
		}
	}
</style>
