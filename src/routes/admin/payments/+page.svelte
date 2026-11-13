<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { BookOpen01Icon, Calendar03Icon, CallIcon, Mail01Icon, Payment01Icon, Tag01Icon, UserIcon, Wallet01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Select from '#lib/sinaui/ui/Select.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import Textarea from '#lib/sinaui/ui/Textarea.svelte';
	import PaymentStatus from '#lib/components/PaymentStatus.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dateTime, money } from '#lib/format.ts';
	import { message } from '#lib/messages.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data, form } = $props();
	let openId = $state<string>();
	const selected = $derived(data.payments.find((p) => p.id === openId));
	const methods = { bkash: 'bKash', nagad: 'Nagad' } as Record<string, string>;
	const review = submitting(() => (openId = undefined));
</script>

<Seo title="Payments | Admin" description="Confirm students' payments." noindex />

<div class="app-page">
	<PageHeader title="Payments">
		{#snippet actions()}<Select label="Show" hideLabel value={data.status} onchange={(e) => goto(`?status=${e.currentTarget.value}`)}>
				<option value="pending">Waiting for confirmation</option>
				<option value="all">All payments</option>
			</Select>{/snippet}
	</PageHeader>

	<Card flush>
		{#if data.payments.length}
			<Table caption="Payments" hideCaption>
				<thead>
					<tr><th>Student</th><th>Course</th><th>Transaction ID</th><th class="num">Amount</th><th>Sent</th><th>Status</th></tr>
				</thead>
				<tbody>
					{#each data.payments as payment (payment.id)}
						<tr onclick={() => (openId = payment.id)}>
							<td><RowLink label={payment.student} onclick={() => (openId = payment.id)} /></td>
							<td>{payment.course}</td>
							<td class="num">{payment.transaction_id}</td>
							<td class="num">{money(payment.amount)}</td>
							<td>{dateTime(payment.created_at)}</td>
							<td><PaymentStatus status={payment.status} /></td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<EmptyState title={data.status === 'pending' ? 'No payments are waiting' : 'No payments yet'} icon={Payment01Icon}>
				When a student submits a bKash or Nagad payment, it appears here for you to confirm.
			</EmptyState>
		{/if}
	</Card>
</div>

<Dialog side="end" title="Payment from {selected?.student ?? ''}" bind:open={() => Boolean(selected), (open) => !open && (openId = undefined)}>
	{#if selected}
		{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}
		<dl class="app-fields">
			<dt><Icon icon={Tag01Icon} size={16} /> Status</dt>
			<dd><PaymentStatus status={selected.status} /></dd>
			<dt><Icon icon={UserIcon} size={16} /> Student</dt>
			<dd>{selected.student}</dd>
			<dt><Icon icon={Mail01Icon} size={16} /> Email</dt>
			<dd>{selected.email}</dd>
			{#if selected.phone}
				<dt><Icon icon={CallIcon} size={16} /> Phone</dt>
				<dd class="num">{selected.phone}</dd>
			{/if}
			<dt><Icon icon={BookOpen01Icon} size={16} /> Course</dt>
			<dd>{selected.course}</dd>
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
			{#if selected.status !== 'pending' && selected.note}
				<dt>Note</dt>
				<dd>{selected.note}</dd>
			{/if}
		</dl>
		{#if selected.status === 'pending'}
			<form id="review" method="post" action="?/approve" class="app-form review" use:enhance={review.enhance}>
				<input type="hidden" name="id" value={selected.id} />
				<Textarea label="Note to the student (optional)" placeholder="We could not find this transaction ID. Please check it and send again." name="note" rows={2} maxlength={300} hint="Shown to the student. Say why if you can't confirm it." />
			</form>
		{/if}
	{/if}
	{#snippet footer()}
		{#if selected?.status === 'pending'}
			<Button type="submit" form="review" variant="outline" formaction="?/reject">Can't confirm</Button>
			<Button type="submit" form="review" loading={review.busy}>Confirm and open course</Button>
		{/if}
	{/snippet}
</Dialog>

<style>
	.review {
		margin-top: 1.5rem;
	}
</style>
