<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import PasswordInput from '#lib/sinaui/ui/PasswordInput.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { message } from '#lib/messages.ts';

	let { data, form } = $props();
	let busy = $state(false);
</script>

<Seo title="Create an account | {data.settings.name}" description="Create your student account." noindex />

<Card title="Create your account" description="Free to join. You only pay when you enroll in a course." level={2}>
	<form
		method="post"
		class="app-form"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		{#if form?.code}<Alert tone="danger" title={message(form.code)} live />{/if}
		<Input label="Full name" name="name" autocomplete="name" required value={form?.values?.name ?? ''} error={form?.errors?.name} hint="Shown on your certificate." />
		<Input label="Email" name="email" type="email" autocomplete="email" required value={form?.values?.email ?? ''} error={form?.errors?.email} />
		<Input label="Phone (optional)" name="phone" type="tel" autocomplete="tel" value={form?.values?.phone ?? ''} error={form?.errors?.phone} />
		<PasswordInput label="Password" name="password" isNew required error={form?.errors?.password} hint="At least 8 characters." />
		<Button type="submit" loading={busy}>Create account</Button>
	</form>
	{#snippet footer()}
		<p>Already have an account? <a href="/login{page.url.search}">Sign in</a></p>
	{/snippet}
</Card>
