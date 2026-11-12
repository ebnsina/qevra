<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The last breadcrumb: where this page sits ("Courses"). */
		crumb: string;
		title: string;
		lede?: string;
		children?: Snippet;
	}
	let { crumb, title, lede, children }: Props = $props();
</script>

<section class="site-page-top">
	<div class="site-wrap">
		<nav aria-label="Breadcrumb" class="site-crumbs"><a href="/">Home</a><span aria-hidden="true">/</span><span>{crumb}</span></nav>
		<h1 class="site-h1">{title}</h1>
		{#if lede}<p class="site-lede">{lede}</p>{/if}
		{@render children?.()}
	</div>
</section>
