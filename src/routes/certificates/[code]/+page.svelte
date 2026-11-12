<script lang="ts">
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data } = $props();
	const certificate = $derived(data.certificate);
</script>

<Seo
	title="Certificate {certificate.code} | {data.settings.name}"
	description="{certificate.student} completed {certificate.course} at {data.settings.name}."
	noindex
/>

<main class="page">
	<div class="actions">
		<p class="muted">This certificate is genuine. It was issued by {data.settings.name}.</p>
		<!-- shortcut: printing to PDF is the download; generate a PDF file on the server if that proves not enough. -->
		<Button onclick={() => window.print()}>Print or save as PDF</Button>
	</div>

	<article class="certificate">
		<Logo name={data.settings.name} logoKey={data.settings.logo_key} />
		<p class="kicker">Certificate of completion</p>
		<p>This certifies that</p>
		<h1>{certificate.student}</h1>
		<p>has successfully completed the course</p>
		<h2>{certificate.course}</h2>
		<div class="foot">
			<p><span class="muted">Issued</span><strong>{date(certificate.issued_at)}</strong></p>
			<p><span class="muted">Certificate no.</span><strong class="num">{certificate.code}</strong></p>
		</div>
	</article>
</main>

<style>
	.page {
		min-height: 100dvh;
		display: grid;
		align-content: center;
		justify-items: center;
		gap: 1.5rem;
		padding: 2rem 1rem;
		background: var(--app-tint);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: min(100%, 56rem);
		font-size: var(--text-sm);
	}
	.certificate {
		width: min(100%, 56rem);
		aspect-ratio: 297 / 210;
		display: grid;
		align-content: center;
		justify-items: center;
		gap: 0.75rem;
		padding: clamp(1.5rem, 6vw, 4rem);
		text-align: center;
		background: var(--ui-surface);
		border-radius: var(--ui-radius);
		box-shadow: var(--ui-shadow-overlay);
		outline: 2px solid var(--ui-accent);
		outline-offset: -1rem;
	}
	.kicker {
		margin-top: 1rem;
		color: var(--ui-accent);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: var(--text-sm);
	}
	h1 {
		font-size: clamp(1.75rem, 5vw, 3rem);
		line-height: 1.15;
	}
	h2 {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		color: var(--ui-accent);
	}
	.foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem 4rem;
		margin-top: 1.5rem;
	}
	.foot p {
		display: grid;
		gap: 0.1rem;
		font-size: var(--text-sm);
	}
	@media print {
		@page {
			size: A4 landscape;
			margin: 0;
		}
		.actions {
			display: none;
		}
		.page {
			padding: 0;
			background: none;
		}
		.certificate {
			width: 100vw;
			height: 100vh;
			border-radius: 0;
			box-shadow: none;
		}
	}
</style>
