<script lang="ts">
	import { BookOpen01Icon, Certificate01Icon, DashboardSquare01Icon, Globe02Icon, Payment01Icon, PencilEdit01Icon, Settings01Icon, UserIcon } from '@hugeicons/core-free-icons';
	import * as Menu from '#lib/sinaui/ui/dropdown/index.ts';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import AppShell from '#lib/components/AppShell.svelte';

	let { data, children } = $props();
	const groups = [
		{
			items: [
				{ label: 'Overview', href: '/portal', icon: DashboardSquare01Icon },
				{ label: 'Payments', href: '/portal/payments', icon: Payment01Icon },
				{ label: 'Notes', href: '/portal/notes', icon: PencilEdit01Icon },
				{ label: 'Certificates', href: '/portal/certificates', icon: Certificate01Icon },
				{ label: 'Profile', href: '/portal/profile', icon: UserIcon }
			]
		},
		{ title: 'Explore', items: [{ label: 'Browse courses', href: '/courses', icon: BookOpen01Icon }] }
	];
</script>

{#if data.user}
	<AppShell label="Student portal" role="Student" home="/portal" {groups} user={data.user}>
		{#snippet menu()}
			{#if data.user?.role === 'admin'}<Menu.Item href="/admin"><Icon icon={Settings01Icon} size={16} />Admin</Menu.Item>{/if}
			<Menu.Item href="/"><Icon icon={Globe02Icon} size={16} />View website</Menu.Item>
		{/snippet}
		{@render children()}
	</AppShell>
{/if}
