<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title: string;
		description: string;
		image?: string | null;
		/** Structured data for search and answer engines. */
		jsonLd?: object;
		/** Signed-in pages stay out of search results. */
		noindex?: boolean;
	}
	let { title, description, image, jsonLd, noindex = false }: Props = $props();

	const canonical = $derived(page.url.origin + page.url.pathname);
	const imageUrl = $derived(image ? page.url.origin + image : null);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex" />{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
	{#if imageUrl}<meta property="og:image" content={imageUrl} />{/if}
	{#if jsonLd}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</scr` + `ipt>`}
	{/if}
</svelte:head>
