<script lang="ts">
	import { enhance } from '$app/forms';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import PasswordInput from '#lib/sinaui/ui/PasswordInput.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { message } from '#lib/messages.ts';

	let { data, form } = $props();
	let busy = $state(false);
</script>

<Seo title="Choose a new password | {data.settings.name}" description="Choose a new password." noindex />

<Card title="Choose a new password" description="You'll be signed out on every device." level={2}>
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
		{#if form && 'code' in form}
			<Alert tone="danger" title={message(form.code)} live>
				{#snippet actions()}<Button size="sm" variant="outline" href="/forgot-password">Get a new link</Button>{/snippet}
			</Alert>
		{/if}
		<PasswordInput label="New password" placeholder="Choose a password" name="password" isNew required error={form && 'errors' in form ? form.errors?.password : undefined} hint="At least 8 characters." />
		<Button type="submit" loading={busy}>Save password</Button>
	</form>
</Card>
