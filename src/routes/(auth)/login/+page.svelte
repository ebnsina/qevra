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

<Seo title="Sign in | {data.settings.name}" description="Sign in to your courses." noindex />

<Card title="Sign in" description="Welcome back. Pick up where you stopped." level={2}>
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
		{#if page.url.searchParams.has('reset')}
			<Alert tone="success" title="Password changed. Sign in with the new one." />
		{/if}
		{#if form?.code}<Alert tone="danger" title={message(form.code)} live />{/if}
		<Input label="Email" placeholder="you@example.com" name="email" type="email" autocomplete="email" required value={form?.values?.email ?? ''} error={form?.errors?.email} />
		<PasswordInput label="Password" placeholder="Your password" name="password" autocomplete="current-password" required error={form?.errors?.password} />
		<Button type="submit" loading={busy}>Sign in</Button>
	</form>
	{#snippet footer()}
		<p class="links"><span class="muted">New here?</span><a href="/register{page.url.search}">Create an account</a></p>
	{/snippet}
</Card>

<style>
	.links {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.9375rem;
		width: 100%;
	}
</style>
