<script lang="ts">
	import { Certificate01Icon, Payment01Icon, Task01Icon, UserGroupIcon, Wallet01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Stat from '#lib/sinaui/blocks/studio/Stat.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date, money, number } from '#lib/format.ts';

	let { data } = $props();
	const stats = $derived([
		{ label: 'Students', value: number(data.totals.students), icon: UserGroupIcon },
		{ label: 'Enrollments', value: number(data.totals.enrollments), icon: BookOpen01Icon },
		{ label: 'Courses completed', value: number(data.totals.completed), icon: Certificate01Icon },
		{ label: 'Confirmed income', value: money(data.totals.income).replace('Free', '৳0'), icon: Wallet01Icon }
	]);
</script>

<Seo title="Dashboard | Admin" description="What needs your attention today." noindex />

<div class="app-page">
	<PageHeader title="Dashboard">
		{#snippet actions()}<Button variant="outline" href="/admin/courses">Manage courses</Button>{/snippet}
	</PageHeader>

	<div class="stats">
		{#each stats as stat (stat.label)}<Stat label={stat.label} value={stat.value} icon={stat.icon} />{/each}
	</div>

	<div class="lists">
		<Card title="Payments to confirm" icon={Payment01Icon} level={2} flush>
			{#snippet aside()}<Button size="sm" variant="outline" href="/admin/payments">View all</Button>{/snippet}
			{#if data.payments.length}
				<ul>
					{#each data.payments as payment (payment.id)}
						<li>
							<a href="/admin/payments">
								<span><strong>{payment.student}</strong><span class="muted">{payment.course}</span></span>
								<span class="end"><strong>{money(payment.amount)}</strong><span class="muted">{date(payment.created_at)}</span></span>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted none">Nothing waiting. New payments show up here.</p>
			{/if}
		</Card>

		<Card title="Assignments to review" icon={Task01Icon} level={2} flush>
			{#snippet aside()}<Button size="sm" variant="outline" href="/admin/submissions">View all</Button>{/snippet}
			{#if data.submissions.length}
				<ul>
					{#each data.submissions as submission (submission.id)}
						<li>
							<a href="/admin/submissions">
								<span><strong>{submission.student}</strong><span class="muted">{submission.lesson}</span></span>
								<span class="end"><span class="muted">{date(submission.created_at)}</span></span>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted none">Nothing waiting. Work students hand in shows up here.</p>
			{/if}
		</Card>
	</div>
</div>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
		gap: var(--app-gap);
	}
	.lists {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: var(--app-gap);
		align-items: start;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--ui-line);
		text-decoration: none;
		font-size: var(--text-sm);
	}
	li a:hover {
		background: var(--ui-subtle);
	}
	li span {
		display: grid;
	}
	.end {
		text-align: end;
	}
	.none {
		padding: 1rem 1.25rem;
		font-size: var(--text-sm);
	}
</style>
