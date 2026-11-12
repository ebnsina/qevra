<script lang="ts">
	import { Certificate01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data } = $props();
</script>

<Seo title="Certificates | {data.settings.name}" description="Your certificates." noindex />

<div class="app-page">
	<PageHeader title="Certificates" />

	{#if data.certificates.length}
		<div class="app-cards">
			{#each data.certificates as certificate (certificate.code)}
				<Card title={certificate.course} description="Issued {date(certificate.issued_at)}" icon={Certificate01Icon} level={2}>
					<p class="muted">Certificate no. <span class="num">{certificate.code}</span></p>
					{#snippet footer()}<Button href="/certificates/{certificate.code}">View and print</Button>{/snippet}
				</Card>
			{/each}
		</div>
	{:else}
		<Card>
			<EmptyState title="No certificates yet" icon={Certificate01Icon}>
				Finish every lesson in a course and its certificate appears here.
				{#snippet actions()}<Button href="/portal">Go to my courses</Button>{/snippet}
			</EmptyState>
		</Card>
	{/if}
</div>
