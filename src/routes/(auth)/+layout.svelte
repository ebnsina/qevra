<script lang="ts">
	import Logo from '#lib/components/Logo.svelte';

	let { data, children } = $props();
</script>

<div class="auth">
	<Logo name={data.settings.name} logoKey={data.settings.logo_key} />
	<main>{@render children()}</main>
</div>

<style>
	.auth {
		min-height: 100dvh;
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
</style>
