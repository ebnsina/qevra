<script lang="ts">
	import { page } from '$app/state';
	import Button from '#lib/sinaui/ui/Button.svelte';
</script>

<svelte:head><title>{page.status === 404 ? 'Page not found' : 'Something went wrong'}</title></svelte:head>

<main class="site-wrap error">
	<p class="site-eyebrow">Error {page.status}</p>
	<h1 class="site-h1">{page.status === 404 ? "We can't find that page." : 'That did not work.'}</h1>
	<p class="site-lede">
		{page.status === 404 ? 'The link may be old, or the page may have moved.' : page.error?.message}
	</p>
	<div><Button href="/">Back to the home page</Button></div>
</main>

<style>
	.error {
		min-height: 100dvh;
		display: grid;
		align-content: center;
		gap: 1.25rem;
	}
</style>
