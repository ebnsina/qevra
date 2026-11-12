<script lang="ts">
	import { enhance } from '$app/forms';
	import { Calendar03Icon, Quiz01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Select from '#lib/sinaui/ui/Select.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import Textarea from '#lib/sinaui/ui/Textarea.svelte';
	import CrudSheet from '#lib/components/CrudSheet.svelte';
	import type { Field } from '#lib/components/fields.ts';
	import Seo from '#lib/components/Seo.svelte';
	import { dateTime, plural } from '#lib/format.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data, form } = $props();

	// One sheet is open at a time: which kind, and which row (null adds a new one).
	type Kind = 'module' | 'lesson' | 'live';
	let sheet = $state<{ kind: Kind; id: string | null; moduleId?: string }>();
	const open = (kind: Kind) => ({
		get: () => sheet?.kind === kind,
		set: (value: boolean) => {
			if (!value) sheet = undefined;
		}
	});
	const moduleOpen = open('module');
	const lessonOpen = open('lesson');
	const liveOpen = open('live');

	const module = $derived(data.modules.find((m) => m.id === sheet?.id) ?? null);
	const lesson = $derived(data.lessons.find((l) => l.id === sheet?.id) ?? null);
	const live = $derived(data.live.find((l) => l.id === sheet?.id) ?? null);
	const questions = $derived(lesson ? data.questions.filter((q) => q.lesson_id === lesson.id) : []);
	const quizCount = (lessonId: string) => data.questions.filter((q) => q.lesson_id === lessonId).length;
	const question = submitting();

	const moduleFields: Field[] = [
		{ name: 'title', label: 'Section title', required: true },
		{ name: 'position', label: 'Order', type: 'number', required: true, hint: 'Lower numbers show first.' }
	];
	const lessonFields = $derived<Field[]>([
		{ name: 'title', label: 'Lesson title', required: true },
		{ name: 'module_id', label: 'Section', type: 'select', required: true, options: data.modules.map((m) => ({ value: m.id, label: m.title })) },
		{ name: 'video_url', label: 'Video link', hint: 'A YouTube, Vimeo or Bunny Stream link. Use an unlisted video for paid lessons.' },
		{ name: 'body', label: 'Notes under the video', type: 'textarea', rows: 6, hint: 'Markdown: ## for a heading, - for a list, **bold**.' },
		{ name: 'assignment', label: 'Assignment', type: 'textarea', rows: 3, hint: 'The task students hand in as a file. Leave empty for no assignment.' },
		{ name: 'position', label: 'Order', type: 'number', required: true, hint: 'Lower numbers show first in the course.' },
		{ name: 'is_preview', label: 'Free preview', type: 'switch', hint: 'Anyone can watch this lesson on the course page before enrolling.' }
	]);
	const liveFields: Field[] = [
		{ name: 'title', label: 'Title', required: true },
		{ name: 'starts_at', label: 'Starts (Bangladesh time)', type: 'datetime', required: true },
		{ name: 'meeting_url', label: 'Zoom or Google Meet link', type: 'url', required: true },
		{ name: 'recording_url', label: 'Recording link', type: 'url', hint: 'Add it after the class so students can watch again.' }
	];
	// A new lesson starts in the section whose "Add lesson" was pressed, at the end.
	const newLesson = $derived({ module_id: sheet?.moduleId ?? '', position: data.lessons.length });
</script>

<Seo title="{data.course.title} lessons | Admin" description="Sections, lessons, quizzes and live classes." noindex />

<div class="app-page">
	<PageHeader title={data.course.title} description="Sections, lessons, quizzes and live classes.">
		{#snippet actions()}
			<Button variant="outline" href="/admin/courses">All courses</Button>
			<Button variant="outline" href="/courses/{data.course.slug}" target="_blank">View course</Button>
			<Button variant="outline" onclick={() => (sheet = { kind: 'live', id: null })}>Add live class</Button>
			<Button onclick={() => (sheet = { kind: 'module', id: null })}>Add section</Button>
		{/snippet}
	</PageHeader>

	{#each data.modules as section (section.id)}
		{@const lessons = data.lessons.filter((l) => l.module_id === section.id)}
		<Card title={section.title} description={plural(lessons.length, 'lesson')} level={2} flush>
			{#snippet aside()}
				<div class="app-actions">
					<Button size="sm" variant="ghost" onclick={() => (sheet = { kind: 'module', id: section.id })}>Edit section</Button>
					<Button size="sm" variant="outline" onclick={() => (sheet = { kind: 'lesson', id: null, moduleId: section.id })}>Add lesson</Button>
				</div>
			{/snippet}
			{#if lessons.length}
				<Table caption="Lessons in {section.title}" hideCaption>
					<thead><tr><th>Lesson</th><th>Has</th></tr></thead>
					<tbody>
						{#each lessons as item (item.id)}
							<tr onclick={() => (sheet = { kind: 'lesson', id: item.id })}>
								<td><RowLink label={item.title} onclick={() => (sheet = { kind: 'lesson', id: item.id })} /></td>
								<td>
									<span class="tags">
										{#if item.is_preview}<Badge icon={false} tone="accent">Free preview</Badge>{/if}
										{#if quizCount(item.id)}<Badge icon={false}>Quiz · {quizCount(item.id)}</Badge>{/if}
										{#if item.assignment}<Badge icon={false}>Assignment</Badge>{/if}
										{#if !item.video_url}<Badge tone="warning">No video</Badge>{/if}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</Table>
			{:else}
				<p class="muted none">No lessons in this section yet.</p>
			{/if}
		</Card>
	{:else}
		<Card>
			<EmptyState title="No sections yet">
				A course is made of sections, and each section holds lessons. Start with a section such as "Getting started".
				{#snippet actions()}<Button onclick={() => (sheet = { kind: 'module', id: null })}>Add section</Button>{/snippet}
			</EmptyState>
		</Card>
	{/each}

	<Card title="Live classes" icon={Calendar03Icon} level={2} description="Enrolled students see these with a Join button." flush>
		{#if data.live.length}
			<Table caption="Live classes" hideCaption>
				<thead><tr><th>Class</th><th>Starts</th><th>Recording</th></tr></thead>
				<tbody>
					{#each data.live as item (item.id)}
						<tr onclick={() => (sheet = { kind: 'live', id: item.id })}>
							<td><RowLink label={item.title} onclick={() => (sheet = { kind: 'live', id: item.id })} /></td>
							<td>{dateTime(item.starts_at)}</td>
							<td>{item.recording_url ? 'Added' : ''}</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<p class="muted none">No live classes planned.</p>
		{/if}
	</Card>
</div>

<CrudSheet bind:open={moduleOpen.get, moduleOpen.set} noun="section" fields={moduleFields} item={module} defaults={{ position: data.modules.length }} saveAction="?/saveModule" deleteAction="?/deleteModule" {form} />

<CrudSheet bind:open={liveOpen.get, liveOpen.set} noun="live class" fields={liveFields} item={live} saveAction="?/saveLive" deleteAction="?/deleteLive" {form} />

<CrudSheet bind:open={lessonOpen.get, lessonOpen.set} noun="lesson" fields={lessonFields} item={lesson} defaults={newLesson} saveAction="?/saveLesson" deleteAction="?/deleteLesson" {form}>
	{#if lesson}
		<section class="quiz">
			<div class="quiz-head">
				<Icon icon={Quiz01Icon} />
				<div>
					<h3>Quiz</h3>
					<p class="muted">Students must get 60% right to finish this lesson. Leave it empty for no quiz.</p>
				</div>
			</div>
			{#each [...questions, null] as item, i (item?.id ?? 'new')}
				<form method="post" action="?/saveQuestion" class="app-form question" use:enhance={question.enhance}>
					<input type="hidden" name="lesson_id" value={lesson.id} />
					<input type="hidden" name="position" value={item?.position ?? questions.length} />
					{#if item}<input type="hidden" name="id" value={item.id} />{/if}
					<Textarea label={item ? `Question ${i + 1}` : 'New question'} name="question" rows={2} required value={item?.question ?? ''} />
					<Textarea label="Answers" name="options" rows={4} required value={item?.options.join('\n') ?? ''} hint="One answer per line, 2 to 4 answers." />
					<div class="app-form-row">
						<Select label="Right answer" name="correct" required value={String((item?.correct ?? 0) + 1)}>
							{#each [1, 2, 3, 4] as n (n)}<option value={String(n)}>Answer {n}</option>{/each}
						</Select>
						<div class="app-form-actions">
							{#if item}
								<Button type="submit" variant="ghost" formaction="?/deleteQuestion" formnovalidate>Delete</Button>
							{/if}
							<Button type="submit" variant="outline" loading={question.busy}>{item ? 'Save question' : 'Add question'}</Button>
						</div>
					</div>
				</form>
			{/each}
		</section>
	{/if}
</CrudSheet>

<style>
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.none {
		padding: 1rem 1.25rem;
		font-size: var(--text-sm);
	}
	.quiz {
		display: grid;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--ui-line);
	}
	.quiz-head {
		display: flex;
		gap: 0.75rem;
		color: var(--ui-accent);
	}
	.quiz-head div {
		color: var(--ui-fg);
	}
	.quiz-head h3 {
		font-size: var(--text-lg);
	}
	.quiz-head p {
		font-size: var(--text-sm);
	}
	.question {
		padding: 1rem;
		border-radius: var(--ui-radius);
		background: var(--ui-subtle);
	}
</style>
