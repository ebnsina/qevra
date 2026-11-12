<script lang="ts">
	import { Calendar03Icon, Payment01Icon, Tag01Icon, Wallet01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import PaymentStatus from '#lib/components/PaymentStatus.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dateTime, money } from '#lib/format.ts';

	let { data } = $props();
	let openId = $state<string>();
	const selected = $derived(data.payments.find((p) => p.id === openId));
	const methods = { bkash: 'bKash', nagad: 'Nagad' } as Record<string, string>;
</script>

<Seo title="Payments | {data.settings.name}" description="Your payments." noindex />

<div class="app-page">
	<PageHeader title="Payments" />

	<Card flush>
		{#if data.payments.length}
			<Table caption="Your payments" hideCaption>
				<thead>
					<tr><th>Course</th><th>Sent</th><th class="num">Amount</th><th>Status</th></tr>
				</thead>
				<tbody>
					{#each data.payments as payment (payment.id)}
						<tr onclick={() => (openId = payment.id)}>
							<td><RowLink label={payment.course} onclick={() => (openId = payment.id)} /></td>
							<td>{dateTime(payment.created_at)}</td>
							<td class="num">{money(payment.amount)}</td>
							<td><PaymentStatus status={payment.status} /></td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<EmptyState title="No payments yet" icon={Payment01Icon}>
				When you enroll in a paid course, your payment shows up here with its status.
				{#snippet actions()}<Button href="/courses">Browse courses</Button>{/snippet}
			</EmptyState>
		{/if}
	</Card>
</div>

<Dialog side="end" title={selected?.course ?? 'Payment'} bind:open={() => Boolean(selected), (open) => !open && (openId = undefined)}>
	{#if selected}
		<dl class="app-fields">
			<dt><Icon icon={Tag01Icon} size={16} /> Status</dt>
			<dd><PaymentStatus status={selected.status} /></dd>
			<dt><Icon icon={Wallet01Icon} size={16} /> Amount</dt>
			<dd class="num">{money(selected.amount)}</dd>
			<dt><Icon icon={Payment01Icon} size={16} /> Paid with</dt>
			<dd>{methods[selected.method]} from <span class="num">{selected.sender_number}</span></dd>
			<dt><Icon icon={Tag01Icon} size={16} /> Transaction ID</dt>
			<dd class="num">{selected.transaction_id}</dd>
			<dt><Icon icon={Calendar03Icon} size={16} /> Sent</dt>
			<dd>{dateTime(selected.created_at)}</dd>
			{#if selected.reviewed_at}
				<dt><Icon icon={Calendar03Icon} size={16} /> Checked</dt>
				<dd>{dateTime(selected.reviewed_at)}</dd>
			{/if}
			{#if selected.note}
				<dt>Note from us</dt>
				<dd>{selected.note}</dd>
			{/if}
		</dl>
	{/if}
	{#snippet footer()}
		{#if selected?.status === 'approved'}
			<Button href="/portal/courses/{selected.slug}">Go to the course</Button>
		{:else if selected?.status === 'rejected'}
			<Button href="/portal/enroll/{selected.slug}">Send payment again</Button>
		{/if}
	{/snippet}
</Dialog>
