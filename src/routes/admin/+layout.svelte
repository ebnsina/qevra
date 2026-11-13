<script lang="ts">
	import {
		Analytics01Icon,
		BookOpen01Icon,
		Comment01Icon,
		Coupon01Icon,
		DashboardSquare01Icon,
		File01Icon,
		Globe02Icon,
		Layers01Icon,
		MessageQuestionIcon,
		News01Icon,
		Payment01Icon,
		Settings01Icon,
		StarIcon,
		Task01Icon,
		UserGroupIcon,
		UserIcon
	} from '@hugeicons/core-free-icons';
	import { QueryClient, setQueryClientContext } from '@tanstack/svelte-query';
	import { adminCounts } from '#lib/admin-query.svelte.ts';
	import * as Menu from '#lib/sinaui/ui/dropdown/index.ts';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import AppShell from '#lib/components/AppShell.svelte';

	let { data, children } = $props();
	// One cache for the whole admin area: every screen under it reads and saves through it.
	setQueryClientContext(new QueryClient());
	// The numbers beside the menu, kept current after every save.
	const counts = adminCounts(() => ({ waiting: data.waiting }));
	const groups = $derived([
		{
			items: [
				{ label: 'Overview', href: '/admin', icon: DashboardSquare01Icon },
				{ label: 'Payments', href: '/admin/payments', icon: Payment01Icon, badge: counts.data.waiting.payments },
				{ label: 'Students', href: '/admin/students', icon: UserGroupIcon },
				{ label: 'Courses', href: '/admin/courses', icon: BookOpen01Icon }
			]
		},
		{
			title: 'Teaching',
			items: [
				{ label: 'Questions', href: '/admin/questions', icon: MessageQuestionIcon, badge: counts.data.waiting.questions },
				{ label: 'Submissions', href: '/admin/submissions', icon: Task01Icon, badge: counts.data.waiting.submissions },
				{ label: 'Course reviews', href: '/admin/course-reviews', icon: StarIcon, badge: counts.data.waiting.reviews },
				{ label: 'Analytics', href: '/admin/analytics', icon: Analytics01Icon },
				{ label: 'Coupons', href: '/admin/coupons', icon: Coupon01Icon }
			]
		},
		{
			title: 'Website',
			items: [
				{ label: 'Site settings', href: '/admin/site', icon: Settings01Icon },
				{ label: 'Blog posts', href: '/admin/posts', icon: News01Icon },
				{ label: 'Pages', href: '/admin/pages', icon: File01Icon },
				{ label: 'Testimonials', href: '/admin/reviews', icon: Comment01Icon },
				{ label: 'Resources', href: '/admin/resources', icon: Layers01Icon },
				{ label: 'Partner logos', href: '/admin/partners', icon: Globe02Icon }
			]
		}
	]);
</script>

{#if data.user}
	<AppShell label="Admin" role="Admin" home="/admin" {groups} user={data.user}>
		{#snippet menu()}
			<Menu.Item href="/portal/profile"><Icon icon={UserIcon} size={16} />Profile and password</Menu.Item>
			<Menu.Item href="/portal"><Icon icon={UserIcon} size={16} />Student portal</Menu.Item>
			<Menu.Item href="/"><Icon icon={Globe02Icon} size={16} />View website</Menu.Item>
		{/snippet}
		{@render children()}
	</AppShell>
{/if}
