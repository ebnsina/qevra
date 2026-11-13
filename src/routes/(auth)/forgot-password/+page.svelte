<script lang="ts">
	import { enhance } from '$app/forms';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data, form } = $props();
	let busy = $state(false);
</script>

<Seo title="Reset your password | {data.settings.name}" description="Get a link to choose a new password." noindex />

<Card title="Forgot your password?" description="Enter your email and we'll send a link to choose a new one." level={2}>
	{#if form && 'sent' in form}
		<Alert tone="success" title="Check your email" live>
			If an account uses that address, a reset link is on its way. It works for 60 minutes.
		</Alert>
	{:else}
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
			<Input label="Email" placeholder="you@example.com" name="email" type="email" autocomplete="email" required error={form?.errors?.email} />
			<Button type="submit" loading={busy}>Send reset link</Button>
		</form>
	{/if}
	{#snippet footer()}<a href="/login">Back to sign in</a>{/snippet}
</Card>
