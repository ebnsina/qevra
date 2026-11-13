<script lang="ts">
	import { adminPage, mutating } from '#lib/admin-query.svelte.ts';
	import { Calendar03Icon, Download01Icon, DragDropVerticalIcon, File01Icon, Megaphone01Icon, Quiz01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import FileDrop from '#lib/sinaui/ui/FileDrop.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import CustomSelect from '#lib/sinaui/ui/CustomSelect.svelte';
	import Sortable from '#lib/sinaui/ui/Sortable.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import Textarea from '#lib/sinaui/ui/Textarea.svelte';
	import CrudSheet from '#lib/components/CrudSheet.svelte';
	import type { Field } from '#lib/components/fields.ts';
	import Seo from '#lib/components/Seo.svelte';
	import { date, dateTime, plural } from '#lib/format.ts';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const form = $derived(admin.form);
	// Saves with nothing to do afterwards (the list simply refreshes).
	const quiet = mutating();

	// One sheet is open at a time: which kind, and which row (null adds a new one).
	type Kind = 'module' | 'lesson' | 'live' | 'announcement';
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
	const announcementOpen = open('announcement');

	const module = $derived(data.modules.find((m) => m.id === sheet?.id) ?? null);
	const lesson = $derived(data.lessons.find((l) => l.id === sheet?.id) ?? null);
	const live = $derived(data.live.find((l) => l.id === sheet?.id) ?? null);
	const announcement = $derived(data.announcements.find((a) => a.id === sheet?.id) ?? null);
	const questions = $derived(lesson ? data.questions.filter((q) => q.lesson_id === lesson.id) : []);
	const files = $derived(lesson ? data.files.filter((f) => f.lesson_id === lesson.id) : []);
	const quizCount = (lessonId: string) => data.questions.filter((q) => q.lesson_id === lessonId).length;
	const fileCount = (lessonId: string) => data.files.filter((f) => f.lesson_id === lessonId).length;
	const question = mutating();
	const upload = mutating();

	// Dragging a section or a lesson sends the new order through this hidden form.
	let orderForm = $state<HTMLFormElement>();
	let order = $state({ kind: 'modules', ids: '' });
	async function saveOrder(kind: 'modules' | 'lessons', rows: { id: string }[]) {
		order = { kind, ids: rows.map((row) => row.id).join(',') };
		// Wait for the inputs to hold the new values before sending.
		await Promise.resolve();
		orderForm?.requestSubmit();
	}

	const moduleFields: Field[] = [{ name: 'title', label: 'Section title', placeholder: 'The noun phrase', required: true }];
	const lessonFields = $derived<Field[]>([
		{ name: 'title', label: 'Lesson title', placeholder: 'Introduction to determiners', required: true },
		{ name: 'module_id', label: 'Section', type: 'select', required: true, options: data.modules.map((m) => ({ value: m.id, label: m.title })) },
		{ name: 'video_url', label: 'Video link', placeholder: 'https://www.youtube.com/watch?v=…', hint: 'A YouTube, Vimeo or Bunny Stream link. Use an unlisted video for paid lessons.' },
		{ name: 'body', label: 'Notes under the video', placeholder: '## Key points\n- A determiner comes before a noun', type: 'textarea', rows: 6, hint: 'Markdown: ## for a heading, - for a list, **bold**.' },
		{ name: 'assignment', label: 'Assignment', placeholder: 'Write five sentences using this, that, these and those. Upload them as a PDF or photo.', type: 'textarea', rows: 3, hint: 'The task students hand in as a file. Leave empty for no assignment.' },
		{ name: 'is_preview', label: 'Free preview', type: 'switch', hint: 'Anyone can watch this lesson on the course page before enrolling.' }
	]);
	const liveFields: Field[] = [
		{ name: 'title', label: 'Title', required: true },
		{ name: 'starts_at', label: 'Starts (Bangladesh time)', type: 'datetime', required: true },
		{ name: 'meeting_url', label: 'Zoom or Google Meet link', placeholder: 'https://meet.google.com/abc-defg-hij', type: 'url', required: true },
		{ name: 'recording_url', label: 'Recording link', placeholder: 'https://www.youtube.com/watch?v=…', type: 'url', hint: 'Add it after the class so students can watch again.' }
	];
	const announcementFields: Field[] = [
		{ name: 'title', label: 'Title', required: true },
		{ name: 'body', label: 'Message', placeholder: 'Friday\'s live class moves to 8 pm. The link is on your course page.', type: 'textarea', rows: 6, hint: "Shown in every enrolled student's portal, and emailed to them when you first post it." }
	];
	// A new lesson goes into the section whose "Add lesson" was pressed.
	const newLesson = $derived({ module_id: sheet?.moduleId ?? '' });
</script>

<Seo title="{data.course.title} lessons | Admin" description="Sections, lessons, quizzes and live classes." noindex />

<div class="app-page">
	<PageHeader title={data.course.title} description="Sections, lessons, quizzes, downloads, live classes and announcements.">
		{#snippet actions()}
			<Button variant="outline" href="/admin/courses/{data.course.id}/edit">Edit details</Button>
			<Button variant="outline" href="/portal/courses/{data.course.slug}">Preview as student</Button>
			<Button onclick={() => (sheet = { kind: 'module', id: null })}>Add section</Button>
		{/snippet}
	</PageHeader>

	{#if form?.announced}
		{@const sent = form.announced as { students: number; unsent: number }}
		<Alert
			tone={sent.unsent ? 'warning' : 'success'}
			title={sent.unsent
				? `Posted. The email could not be sent to ${plural(sent.unsent, 'student')}; they will still see it in their portal.`
				: `Posted and emailed to ${plural(sent.students, 'student')}.`}
			live
		/>
	{/if}

	{#if data.modules.length}
		<Sortable items={data.modules} key={(m) => m.id} itemLabel={(m) => m.title} label="Sections" onreorder={(rows) => saveOrder('modules', rows)}>
			{#snippet children(section, handle)}
				{@const lessons = data.lessons.filter((l) => l.module_id === section.id)}
				<div class="section">
					<Card title={section.title} description={plural(lessons.length, 'lesson')} level={2} flush>
						{#snippet aside()}
							<div class="app-actions">
								<Button size="sm" variant="ghost" onclick={() => (sheet = { kind: 'module', id: section.id })}>Rename</Button>
								<Button size="sm" variant="outline" onclick={() => (sheet = { kind: 'lesson', id: null, moduleId: section.id })}>Add lesson</Button>
								<Button size="sm" variant="ghost" square {...handle}><Icon icon={DragDropVerticalIcon} /></Button>
							</div>
						{/snippet}
						{#if lessons.length}
							<Sortable items={lessons} key={(l) => l.id} itemLabel={(l) => l.title} label="Lessons in {section.title}" onreorder={(rows) => saveOrder('lessons', rows)}>
								{#snippet children(item, grip)}
									<div class="lesson">
										<Button size="sm" variant="ghost" square {...grip}><Icon icon={DragDropVerticalIcon} /></Button>
										<RowLink label={item.title} onclick={() => (sheet = { kind: 'lesson', id: item.id })} />
										<span class="tags">
											{#if item.is_preview}<Badge icon={false} tone="accent">Free preview</Badge>{/if}
											{#if quizCount(item.id)}<Badge icon={false}>Quiz · {quizCount(item.id)}</Badge>{/if}
											{#if item.assignment}<Badge icon={false}>Assignment</Badge>{/if}
											{#if fileCount(item.id)}<Badge icon={false}>{plural(fileCount(item.id), 'file')}</Badge>{/if}
											{#if !item.video_url && !item.assignment}<Badge tone="warning">No video</Badge>{/if}
										</span>
									</div>
								{/snippet}
							</Sortable>
						{:else}
							<p class="muted none">No lessons in this section yet.</p>
						{/if}
					</Card>
				</div>
			{/snippet}
		</Sortable>
	{:else}
		<Card>
			<EmptyState title="No sections yet">
				A course is made of sections, and each section holds lessons. Start with a section such as "Getting started".
				{#snippet actions()}<Button onclick={() => (sheet = { kind: 'module', id: null })}>Add section</Button>{/snippet}
			</EmptyState>
		</Card>
	{/if}

	<Card title="Live classes" icon={Calendar03Icon} level={2} description="Enrolled students see these with a Join button." flush>
		{#snippet aside()}<Button size="sm" variant="outline" onclick={() => (sheet = { kind: 'live', id: null })}>Add live class</Button>{/snippet}
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

	<Card title="Announcements" icon={Megaphone01Icon} level={2} description="News for everyone in this course: new lessons, a moved class." flush>
		{#snippet aside()}<Button size="sm" variant="outline" onclick={() => (sheet = { kind: 'announcement', id: null })}>New announcement</Button>{/snippet}
		{#if data.announcements.length}
			<Table caption="Announcements" hideCaption>
				<thead><tr><th>Title</th><th>Posted</th></tr></thead>
				<tbody>
					{#each data.announcements as item (item.id)}
						<tr onclick={() => (sheet = { kind: 'announcement', id: item.id })}>
							<td><RowLink label={item.title} onclick={() => (sheet = { kind: 'announcement', id: item.id })} /></td>
							<td>{date(item.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<p class="muted none">Nothing posted yet.</p>
		{/if}
	</Card>
</div>

<form method="post" action="?/reorder" bind:this={orderForm} onsubmit={quiet.submit} hidden>
	<input type="hidden" name="kind" value={order.kind} />
	<input type="hidden" name="ids" value={order.ids} />
</form>

<CrudSheet bind:open={moduleOpen.get, moduleOpen.set} noun="section" fields={moduleFields} item={module} hidden={{ position: String(module?.position ?? data.modules.length) }} saveAction="?/saveModule" deleteAction="?/deleteModule" {form} />

<CrudSheet bind:open={liveOpen.get, liveOpen.set} noun="live class" fields={liveFields} item={live} saveAction="?/saveLive" deleteAction="?/deleteLive" {form} />

<CrudSheet bind:open={announcementOpen.get, announcementOpen.set} noun="announcement" fields={announcementFields} item={announcement} saveAction="?/saveAnnouncement" deleteAction="?/deleteAnnouncement" {form} />

<CrudSheet bind:open={lessonOpen.get, lessonOpen.set} noun="lesson" fields={lessonFields} item={lesson} defaults={newLesson} hidden={{ position: String(lesson?.position ?? data.lessons.length) }} saveAction="?/saveLesson" deleteAction="?/deleteLesson" {form}>
	{#if lesson}
		<section class="extra">
			<div class="extra-head">
				<Icon icon={Download01Icon} />
				<div>
					<h3>Downloads</h3>
					<p class="muted">Lecture sheets and practice sets. Only enrolled students can download them.</p>
				</div>
			</div>
			{#if files.length}
				<ul class="files">
					{#each files as file (file.id)}
						<li>
							<Icon icon={File01Icon} size={16} />
							<a href="/files/{file.file_key}" download={file.file_name}>{file.title}</a>
							<form method="post" action="?/deleteFile" onsubmit={quiet.submit}>
								<input type="hidden" name="id" value={file.id} />
								<Button type="submit" variant="ghost" size="sm">Remove</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
			<form method="post" action="?/saveFile" enctype="multipart/form-data" class="app-form block" onsubmit={upload.submit}>
				<input type="hidden" name="lesson_id" value={lesson.id} />
				<Input label="Name of the download" name="title" required maxlength={120} placeholder="Lecture sheet" />
				<FileDrop label="File" name="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" maxSize={4 * 1024 * 1024} hint="PDF, Word or an image, up to 4 MB." />
				<div class="app-form-actions"><Button type="submit" variant="outline" loading={upload.busy}>Add download</Button></div>
			</form>
		</section>

		<section class="extra">
			<div class="extra-head">
				<Icon icon={Quiz01Icon} />
				<div>
					<h3>Quiz</h3>
					<p class="muted">Students must get 60% right to finish this lesson. Leave it empty for no quiz.</p>
				</div>
			</div>
			{#each [...questions, null] as item, i (item?.id ?? 'new')}
				<form method="post" action="?/saveQuestion" class="app-form block" onsubmit={question.submit}>
					<input type="hidden" name="lesson_id" value={lesson.id} />
					<input type="hidden" name="position" value={item?.position ?? questions.length} />
					{#if item}<input type="hidden" name="id" value={item.id} />{/if}
					<Textarea label={item ? `Question ${i + 1}` : 'New question'} placeholder="Which word comes before a singular noun that starts with a vowel sound?" name="question" rows={2} required value={item?.question ?? ''} />
					<Textarea label="Answers" placeholder={'a\nan\nthe'} name="options" rows={4} required value={item?.options.join('\n') ?? ''} hint="One answer per line, 2 to 4 answers." />
					<div class="app-form-row">
						<CustomSelect label="Right answer" name="correct" required value={String((item?.correct ?? 0) + 1)} options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: `Answer ${n}` }))} />
						<div class="app-form-actions">
							{#if item}<Button type="submit" variant="ghost" formaction="?/deleteQuestion" formnovalidate>Delete</Button>{/if}
							<Button type="submit" variant="outline" loading={question.busy}>{item ? 'Save question' : 'Add question'}</Button>
						</div>
					</div>
				</form>
			{/each}
		</section>
	{/if}
</CrudSheet>

<style>
	.section {
		margin-bottom: var(--app-gap);
	}
	.lesson {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-top: 1px solid var(--ui-line);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-inline-start: auto;
	}
	.none {
		padding: 1rem 1.25rem;
		font-size: 0.875rem;
	}
	.extra {
		display: grid;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--ui-line);
	}
	.extra-head {
		display: flex;
		gap: 0.75rem;
		color: var(--ui-accent);
	}
	.extra-head div {
		color: var(--ui-fg);
	}
	.extra-head h3 {
		font-size: 1.0625rem;
	}
	.extra-head p {
		font-size: 0.875rem;
	}
	.block {
		padding: 1rem;
		border-radius: var(--ui-radius);
		background: var(--ui-subtle);
	}
	.files {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.25rem;
	}
	.files li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.files form {
		margin-inline-start: auto;
	}
</style>
