<script lang="ts">
	import { enhance } from '$app/forms';
	import { LockIcon, UserIcon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import PasswordInput from '#lib/sinaui/ui/PasswordInput.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { message } from '#lib/messages.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data, form } = $props();
	const errors = $derived(form && 'errors' in form ? form.errors : undefined);
	const profile = submitting();
	const password = submitting();
</script>

<Seo title="Profile | {data.settings.name}" description="Your account details." noindex />

<div class="app-page narrow">
	<PageHeader title="Profile" />

	{#if form && 'saved' in form}
		<Alert tone="success" title={form.saved === 'profile' ? 'Your details are saved.' : 'Your password is changed.'} live />
	{/if}
	{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}

	<Card title="Your details" icon={UserIcon} level={2} description="Your name is printed on your certificates.">
		<form method="post" action="?/profile" class="app-form" use:enhance={profile.enhance}>
			<Input label="Full name" placeholder="Nusrat Jahan" name="name" required value={data.user?.name ?? ''} error={errors?.name} />
			<div class="app-form-row">
				<Input label="Email" value={data.user?.email ?? ''} disabled hint="Contact us to change your email." />
				<Input label="Phone" placeholder="+880 1700-000000" name="phone" type="tel" required value={data.user?.phone ?? ''} error={errors?.phone} />
			</div>
			<div class="app-form-actions"><Button type="submit" loading={profile.busy}>Save details</Button></div>
		</form>
	</Card>

	<Card title="Password" icon={LockIcon} level={2}>
		<form method="post" action="?/password" class="app-form" use:enhance={password.enhance}>
			<PasswordInput label="Current password" placeholder="Your current password" name="current_password" autocomplete="current-password" required error={errors?.current_password} />
			<PasswordInput label="New password" placeholder="Choose a password" name="new_password" isNew required error={errors?.new_password} hint="At least 8 characters." />
			<div class="app-form-actions"><Button type="submit" loading={password.busy}>Change password</Button></div>
		</form>
	</Card>
</div>

<style>
	.narrow {
		max-width: 44rem;
	}
</style>
