import { error, fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { embedUrl } from '#lib/embed.ts';
import { fromLocalInput } from '#lib/format.ts';
import { deleteRow, isFailure, saveRow, uploadFrom } from '#lib/server/admin.ts';
import { sendMail } from '#lib/server/mail.ts';
import { UUID, checkbox, httpsUrl, id, optionalId, parseForm, requiredText, text, wholeNumber } from '#lib/server/form.ts';

const Module = v.object({ id: optionalId, title: requiredText(120), position: wholeNumber });
const Lesson = v.object({
	id: optionalId,
	module_id: id,
	title: requiredText(160),
	position: wholeNumber,
	video_url: v.pipe(
		text(500),
		v.check((url) => url === '' || embedUrl(url) !== null, 'Paste a YouTube, Vimeo or Bunny Stream video link')
	),
	body: text(50_000),
	assignment: text(2000),
	is_preview: checkbox
});
const Question = v.pipe(
	v.object({
		id: optionalId,
		lesson_id: id,
		question: requiredText(500),
		options: v.pipe(
			v.string(),
			v.transform((value) => value.split('\n').map((line) => line.trim()).filter(Boolean)),
			v.minLength(2, 'Write at least 2 answers, one per line'),
			v.maxLength(4, 'Write at most 4 answers')
		),
		correct: v.pipe(wholeNumber, v.minValue(1, 'Choose the right answer')),
		position: wholeNumber
	}),
	v.forward(
		v.check((q) => q.correct <= q.options.length, 'The right answer must be one of the answers above'),
		['correct']
	)
);
const Live = v.object({
	id: optionalId,
	title: requiredText(160),
	starts_at: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Choose a date and time')),
	meeting_url: httpsUrl,
	recording_url: v.union([v.literal(''), httpsUrl])
});

const File = v.object({ lesson_id: id, title: requiredText(120) });
const Announcement = v.object({ id: optionalId, title: requiredText(160), body: text(4000) });
const Order = v.object({
	kind: v.picklist(['modules', 'lessons']),
	ids: v.pipe(v.string(), v.transform((value) => value.split(',').filter(Boolean)), v.array(id))
});

export async function load({ locals, params }) {
	if (!UUID.test(params.id)) error(404, 'Course not found');
	return locals.db(async (tx) => {
		const [course] = await tx<{ id: string; title: string; slug: string }[]>`select id, title, slug from courses where id = ${params.id}`;
		if (!course) error(404, 'Course not found');
		const modules = await tx<{ id: string; title: string; position: number }[]>`
			select id, title, position from modules where course_id = ${course.id} order by position, title`;
		const lessons = await tx<{ id: string; module_id: string; title: string; position: number; video_url: string; body: string; assignment: string; is_preview: boolean }[]>`
			select id, module_id, title, position, video_url, body, assignment, is_preview
			from lessons where course_id = ${course.id} order by position, title`;
		const questions = await tx<{ id: string; lesson_id: string; question: string; options: string[]; correct: number; position: number }[]>`
			select q.id, q.lesson_id, q.question, q.options, q.correct, q.position
			from quiz_questions q join lessons l on l.id = q.lesson_id
			where l.course_id = ${course.id} order by q.position, q.id`;
		const live = await tx<{ id: string; title: string; starts_at: Date; meeting_url: string; recording_url: string }[]>`
			select id, title, starts_at, meeting_url, recording_url from live_classes where course_id = ${course.id} order by starts_at`;
		const files = await tx<{ id: string; lesson_id: string; title: string; file_key: string; file_name: string }[]>`
			select f.id, f.lesson_id, f.title, f.file_key, f.file_name
			from lesson_files f join lessons l on l.id = f.lesson_id
			where l.course_id = ${course.id} order by f.position, f.title`;
		const announcements = await tx<{ id: string; title: string; body: string; created_at: Date }[]>`
			select id, title, body, created_at from announcements where course_id = ${course.id} order by created_at desc`;
		return { course, modules, lessons, questions, live, files, announcements };
	});
}

export const actions = {
	saveModule: async ({ locals, params, request }) => {
		const form = await parseForm(Module, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		return saveRow(locals.db, 'modules', id, { ...row, course_id: params.id });
	},
	deleteModule: async ({ locals, request }) => deleteRow(locals.db, 'modules', await request.formData()),

	saveLesson: async ({ locals, params, request }) => {
		const form = await parseForm(Lesson, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		return saveRow(locals.db, 'lessons', id, { ...row, course_id: params.id });
	},
	deleteLesson: async ({ locals, request }) => deleteRow(locals.db, 'lessons', await request.formData()),

	saveQuestion: async ({ locals, request }) => {
		const form = await parseForm(Question, request);
		if ('invalid' in form) return form.invalid;
		const { id, correct, ...row } = form.data;
		// The form counts answers from 1; the database from 0.
		return saveRow(locals.db, 'quiz_questions', id, { ...row, correct: correct - 1 });
	},
	deleteQuestion: async ({ locals, request }) => deleteRow(locals.db, 'quiz_questions', await request.formData()),

	saveFile: async ({ locals, params, request }) => {
		const form = await parseForm(File, request);
		if ('invalid' in form) return form.invalid;
		// Kept under the course's id, which is how the file route knows who may download it.
		const upload = await uploadFrom(form.formData, 'file', `lessons/${params.id}`, 'document');
		if (!upload) return fail(400, { code: 'file_missing' });
		if ('error' in upload) return fail(400, { code: upload.error });
		return saveRow(locals.db, 'lesson_files', null, { ...form.data, file_key: upload.key, file_name: upload.name });
	},
	deleteFile: async ({ locals, request }) => deleteRow(locals.db, 'lesson_files', await request.formData(), 'file_key'),

	// A new announcement also goes to every enrolled student by email. Editing one later does not send again.
	saveAnnouncement: async ({ locals, params, request, url }) => {
		const form = await parseForm(Announcement, request);
		if ('invalid' in form) return form.invalid;
		const { id: announcementId, ...row } = form.data;
		const saved = await saveRow(locals.db, 'announcements', announcementId, { ...row, course_id: params.id });
		if (isFailure(saved) || announcementId) return saved;

		const students = await locals.db((tx) => tx<{ email: string; course: string }[]>`
			select u.email, c.title as course from enrollments e
			join users u on u.id = e.user_id join courses c on c.id = e.course_id
			where e.course_id = ${params.id}`);
		const sent = await Promise.allSettled(
			students.map((s) => sendMail(s.email, `${s.course}: ${row.title}`, `${row.body}\n\nOpen your courses: ${url.origin}/portal`))
		);
		const unsent = sent.filter((r) => r.status === 'rejected');
		// The announcement is saved and shows in the portal either way; a mail failure is reported, not hidden.
		if (unsent.length) console.error(`announcement email failed for ${unsent.length} of ${students.length}`, (unsent[0] as PromiseRejectedResult).reason);
		return { announced: { students: students.length, unsent: unsent.length } };
	},
	deleteAnnouncement: async ({ locals, request }) => deleteRow(locals.db, 'announcements', await request.formData()),

	// The new order of a course's sections, or of the lessons in one section, after a drag.
	reorder: async ({ locals, params, request }) => {
		const form = await parseForm(Order, request);
		if ('invalid' in form) return form.invalid;
		const { kind, ids } = form.data;
		await locals.db(async (tx) => {
			for (const [position, rowId] of ids.entries()) {
				await tx`update ${tx(kind)} set position = ${position} where id = ${rowId} and course_id = ${params.id}`;
			}
		});
	},

	saveLive: async ({ locals, params, request }) => {
		const form = await parseForm(Live, request);
		if ('invalid' in form) return form.invalid;
		const { id, starts_at, ...row } = form.data;
		return saveRow(locals.db, 'live_classes', id, { ...row, starts_at: fromLocalInput(starts_at), course_id: params.id });
	},
	deleteLive: async ({ locals, request }) => deleteRow(locals.db, 'live_classes', await request.formData())
};
