<script lang="ts">
	import { enhance } from '$app/forms';
	import { Calendar03Icon, CallIcon, Mail01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import Select from '#lib/sinaui/ui/Select.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date, number, plural } from '#lib/format.ts';
	import { message } from '#lib/messages.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data, form } = $props();
	let query = $state('');
	let openId = $state<string>();
	const shown = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return q ? data.students.filter((s) => `${s.name} ${s.email} ${s.phone}`.toLowerCase().includes(q)) : data.students;
	});
	const selected = $derived(data.students.find((s) => s.id === openId));
	const enrollments = $derived(data.enrollments.filter((e) => e.user_id === openId));
	const count = (id: string) => data.enrollments.filter((e) => e.user_id === id).length;
	// Only courses the student isn't in yet can be added.
	const available = $derived(data.courses.filter((c) => !enrollments.some((e) => e.course_id === c.id)));
	const enroll = submitting();
</script>

<Seo title="Students | Admin" description="Students and their courses." noindex />

<div class="app-page">
	<PageHeader title="Students">
		{#snippet actions()}<Input label="Search students" hideLabel type="search" placeholder="Search by name, email or phone" bind:value={query} />{/snippet}
	</PageHeader>

	<Card flush>
		{#if shown.length}
			<Table caption="Students" hideCaption>
				<thead><tr><th>Name</th><th>Email</th><th>Phone</th><th class="num">Courses</th><th>Joined</th></tr></thead>
				<tbody>
					{#each shown as student (student.id)}
						<tr onclick={() => (openId = student.id)}>
							<td><RowLink label={student.name} onclick={() => (openId = student.id)} /></td>
							<td>{student.email}</td>
							<td class="num">{student.phone}</td>
							<td class="num">{number(count(student.id))}</td>
							<td>{date(student.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else if data.students.length}
			<EmptyState title="No student matches “{query}”" icon={UserGroupIcon}>
				Check the spelling, or search by email or phone instead.
				{#snippet actions()}<Button variant="outline" onclick={() => (query = '')}>Clear search</Button>{/snippet}
			</EmptyState>
		{:else}
			<EmptyState title="No students yet" icon={UserGroupIcon}>Students appear here when they create an account on the website.</EmptyState>
		{/if}
	</Card>
</div>

<Dialog side="end" title={selected?.name ?? 'Student'} bind:open={() => Boolean(selected), (open) => !open && (openId = undefined)}>
	{#if selected}
		{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}
		{#if form && 'enrolled' in form}<Alert tone="success" title="Course opened for this student." live />{/if}
		<dl class="app-fields">
			<dt><Icon icon={Mail01Icon} size={16} /> Email</dt>
			<dd><a href="mailto:{selected.email}">{selected.email}</a></dd>
			<dt><Icon icon={CallIcon} size={16} /> Phone</dt>
			<dd class="num">{selected.phone || 'Not given'}</dd>
			<dt><Icon icon={Calendar03Icon} size={16} /> Joined</dt>
			<dd>{date(selected.created_at)}</dd>
		</dl>

		<h3 class="sub">Courses</h3>
		{#if enrollments.length}
			<ul class="courses">
				{#each enrollments as enrollment (enrollment.course_id)}
					<li>
						<div class="row">
							<strong>{enrollment.course}</strong>
							{#if enrollment.completed_at}<Badge tone="accent">Completed</Badge>{/if}
						</div>
						<Progress label="{enrollment.done} of {plural(enrollment.total, 'lesson')} done" value={enrollment.done} max={Math.max(enrollment.total, 1)} />
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">Not enrolled in any course yet.</p>
		{/if}

		{#if available.length}
			<form method="post" action="?/enroll" class="app-form-row add" use:enhance={enroll.enhance}>
				<input type="hidden" name="user_id" value={selected.id} />
				<Select label="Open a course without payment" name="course_id" required placeholder="Choose a course">
					{#each available as course (course.id)}<option value={course.id}>{course.title}</option>{/each}
				</Select>
				<Button type="submit" variant="outline" loading={enroll.busy}>Enroll</Button>
			</form>
		{/if}
	{/if}
</Dialog>

<style>
	.sub {
		margin: 1.75rem 0 0.75rem;
		font-size: var(--text-lg);
	}
	.courses {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}
	.add {
		margin-top: 1.5rem;
		grid-template-columns: 1fr auto;
	}
</style>
