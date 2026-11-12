<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import Select from '#lib/sinaui/ui/Select.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date, money } from '#lib/format.ts';
	import { message } from '#lib/messages.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data, form } = $props();
	const course = $derived(data.course);
	const pending = $derived(data.payment?.status === 'pending');
	const errors = $derived(form && 'errors' in form ? form.errors : undefined);
	const values = $derived(form && 'values' in form ? form.values : undefined);
	const send = submitting();
</script>

<Seo title="Enroll in {course.title} | {data.settings.name}" description="Enroll in {course.title}." noindex />

<div class="app-page narrow">
	<PageHeader title="Enroll in {course.title}" description={course.summary}>
		{#snippet actions()}<p class="num price">{money(course.price)}</p>{/snippet}
	</PageHeader>

	{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}

	{#if course.price === 0}
		<Card title="This course is free" description="Start right away. No payment needed." level={2}>
			{#snippet footer()}
				<form method="post" action="?/free" use:enhance={send.enhance}>
					<Button type="submit" loading={send.busy}>Start the course</Button>
				</form>
			{/snippet}
		</Card>
	{:else if pending && data.payment}
		<Alert tone="info" title="We are checking your payment">
			Transaction <strong class="num">{data.payment.transaction_id}</strong>, sent on {date(data.payment.created_at)}. The course opens as
			soon as it is confirmed, usually within a day.
			{#snippet actions()}<Button size="sm" variant="outline" href="/portal/payments">View payments</Button>{/snippet}
		</Alert>
	{:else}
		{#if data.payment?.status === 'rejected'}
			<Alert tone="warning" title="Your last payment could not be confirmed">
				{data.payment.note || 'Check the transaction ID and send it again.'}
			</Alert>
		{/if}

		<Card title="1. Send the fee" description={data.pay.note} level={2}>
			{#if data.pay.bkash || data.pay.nagad}
				<dl class="app-fields">
					<dt>Amount</dt>
					<dd><strong class="num">{money(course.price)}</strong></dd>
					{#if data.pay.bkash}
						<dt>bKash</dt>
						<dd class="num">{data.pay.bkash}</dd>
					{/if}
					{#if data.pay.nagad}
						<dt>Nagad</dt>
						<dd class="num">{data.pay.nagad}</dd>
					{/if}
				</dl>
			{:else}
				<Alert tone="warning" title="Payment numbers are not set up yet">
					Message us and we will tell you where to send the fee.
					{#snippet actions()}<Button size="sm" variant="outline" href="/contact">Contact us</Button>{/snippet}
				</Alert>
			{/if}
		</Card>

		<Card title="2. Tell us about the payment" description="We match these details with our account, then open the course for you." level={2}>
			<form method="post" action="?/pay" class="app-form" use:enhance={send.enhance}>
				<div class="app-form-row">
					<Select label="Paid with" name="method" required value={values?.method ?? 'bkash'} error={errors?.method}>
						<option value="bkash">bKash</option>
						<option value="nagad">Nagad</option>
					</Select>
					<Input label="Number you paid from" name="sender_number" type="tel" required placeholder="01XXXXXXXXX" value={values?.sender_number ?? ''} error={errors?.sender_number} />
				</div>
				<Input label="Transaction ID" name="transaction_id" required placeholder="e.g. 9AB1CD2EFG" value={values?.transaction_id ?? ''} error={errors?.transaction_id} hint="It is in the confirmation message from bKash or Nagad." />
				<div class="app-form-actions">
					<Button variant="outline" href="/courses/{course.slug}">Cancel</Button>
					<Button type="submit" loading={send.busy}>Submit payment</Button>
				</div>
			</form>
		</Card>
	{/if}
</div>

<style>
	.narrow {
		max-width: 44rem;
	}
	.price {
		font-size: 1.5rem;
		font-weight: 600;
	}
</style>
