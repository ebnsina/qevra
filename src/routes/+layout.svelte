<script lang="ts">
	import '../lib/sinaui/ui/tokens.css';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { Toaster } from '#lib/sinaui/ui/toast/index.ts';

	import { onColor } from '#lib/color.ts';

	let { data, children } = $props();
	// The setting is validated as #rrggbb when saved, so it is safe to place in a style rule.
	const brand = $derived(data.settings.brand_color);

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html `<style>:root{--brand:${brand};--on-brand:${onColor(brand)}}</style>`}
</svelte:head>

{@render children()}
<Toaster />
