import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { embedUrl } from '#lib/embed.ts';
import { gradeQuiz } from '#lib/quiz.ts';
import { UUID, id, parseForm, requiredText, text, wholeNumber } from '#lib/server/form.ts';
import { completeLessonIfDone } from '#lib/server/learning.ts';
import { renderMarkdown } from '#lib/server/markdown.ts';
import { chosenFile, deleteFile, saveUpload } from '#lib/server/storage.ts';

export async function load({ locals, params }) {
	if (!UUID.test(params.lesson)) error(404, 'Lesson not found');
	const userId = locals.user!.id;
	// Staff can open any course to see it as a student does, without being enrolled.
	const staff = locals.user!.role === 'admin';
	return locals.db(async (tx) => {
		const [course] = await tx<{ id: string; slug: string; title: string; enrolled: boolean }[]>`
			select c.id, c.slug, c.title,
				exists (select 1 from enrollments e where e.course_id = c.id and e.user_id = ${userId}) as enrolled
			from courses c where c.slug = ${params.slug}`;
		if (!course || (!course.enrolled && !staff)) redirect(303, `/portal/enroll/${params.slug}`);

		const lessons = await tx<{ id: string; title: string; module: string; done: boolean }[]>`
			select l.id, l.title, m.title as module, p.lesson_id is not null as done
			from lessons l
			join modules m on m.id = l.module_id
			left join lesson_progress p on p.lesson_id = l.id and p.user_id = ${userId}
			where l.course_id = ${course.id}
			order by m.position, l.position, l.title`;
		const index = lessons.findIndex((l) => l.id === params.lesson);
		if (index === -1) error(404, 'Lesson not found');

		const [lesson] = await tx<{ id: string; title: string; video_url: string; body: string; assignment: string }[]>`
			select id, title, video_url, body, assignment from lessons where id = ${params.lesson}`;
		// The right answers stay on the server.
		// Sent together: one trip to the database instead of one per query.
		const [
			questions,
			[attempt],
			[submission],
			live,
			[certificate],
			files,
			posts,
			[note],
			[review]
		] = await Promise.all([
		tx<{ id: string; question: string; options: string[] }[]>`
			select id, question, options from quiz_questions where lesson_id = ${lesson.id} order by position, id`,
		tx<{ score: number; total: number; passed: boolean }[]>`
			select score, total, passed from quiz_attempts
			where lesson_id = ${lesson.id} and user_id = ${userId}
			order by passed desc, created_at desc limit 1`,
		tx<{ file_key: string; file_name: string; note: string; grade: string; feedback: string; reviewed_at: Date | null }[]>`
			select file_key, file_name, note, grade, feedback, reviewed_at from submissions
			where lesson_id = ${lesson.id} and user_id = ${userId}`,
		tx<{ id: string; title: string; starts_at: Date; meeting_url: string; recording_url: string }[]>`
			select id, title, starts_at, meeting_url, recording_url from live_classes
			where course_id = ${course.id} order by starts_at`,
		tx<{ code: string }[]>`
			select code from certificates where course_id = ${course.id} and user_id = ${userId}`,
		tx<{ id: string; title: string; file_key: string; file_name: string }[]>`
			select id, title, file_key, file_name from lesson_files where lesson_id = ${lesson.id} order by position, title`,
		tx<{ id: string; parent_id: string | null; user_id: string; author_name: string; by_staff: boolean; body: string; created_at: Date }[]>`
			select id, parent_id, user_id, author_name, by_staff, body, created_at
			from lesson_posts where lesson_id = ${lesson.id} order by created_at`,
		tx<{ body: string }[]>`
			select body from lesson_notes where lesson_id = ${lesson.id} and user_id = ${userId}`,
		tx<{ rating: number; body: string; approved: boolean }[]>`
			select rating, body, approved from course_reviews where course_id = ${course.id} and user_id = ${userId}`,
		]);

		return {
			course,
			lessons,
			lesson: {
				id: lesson.id,
				title: lesson.title,
				video: embedUrl(lesson.video_url),
				html: renderMarkdown(lesson.body),
				assignment: lesson.assignment,
				done: lessons[index].done
			},
			previous: lessons[index - 1]?.id ?? null,
			next: lessons[index + 1]?.id ?? null,
			questions,
			attempt: attempt ?? null,
			submission: submission ?? null,
			live: live.map((l) => ({ ...l, past: l.starts_at.getTime() < Date.now() - 2 * 3_600_000 })),
			certificate: certificate?.code ?? null,
			files,
			// Each question with its replies under it, newest question first.
			threads: posts
				.filter((p) => !p.parent_id)
				.map((question) => ({ ...question, replies: posts.filter((p) => p.parent_id === question.id) }))
				.reverse(),
			note: note?.body ?? '',
			review: review ?? null,
			preview: !course.enrolled
		};
	});
}

const Post = v.object({ body: requiredText(4000), parent_id: v.optional(id) });
const Review = v.object({
	rating: v.pipe(wholeNumber, v.minValue(1, 'Choose 1 to 5 stars'), v.maxValue(5, 'Choose 1 to 5 stars')),
	body: text(2000)
});

export const actions = {
	// A question, or a reply when it names the question it answers.
	post: async ({ locals, params, request }) => {
		const form = await parseForm(Post, request);
		if ('invalid' in form) return form.invalid;
		const user = locals.user!;
		await locals.db(async (tx) => {
			// A reply must belong to a question in this same lesson.
			const [parent] = form.data.parent_id
				? await tx`select 1 from lesson_posts where id = ${form.data.parent_id} and lesson_id = ${params.lesson} and parent_id is null`
				: [true];
			if (!parent) return;
			await tx`insert into lesson_posts (lesson_id, user_id, parent_id, author_name, by_staff, body)
				values (${params.lesson}, ${user.id}, ${form.data.parent_id ?? null}, ${user.name}, ${user.role === 'admin'}, ${form.data.body})`;
		});
		return { posted: true };
	},

	deletePost: async ({ locals, request }) => {
		const form = await parseForm(v.object({ id }), request);
		if ('invalid' in form) return form.invalid;
		// Row-level security only lets a student delete their own.
		await locals.db((tx) => tx`delete from lesson_posts where id = ${form.data.id}`);
	},

	note: async ({ locals, params, request }) => {
		const form = await parseForm(v.object({ body: text(10_000) }), request);
		if ('invalid' in form) return form.invalid;
		const userId = locals.user!.id;
		await locals.db((tx) =>
			form.data.body
				? tx`insert into lesson_notes (user_id, lesson_id, body) values (${userId}, ${params.lesson}, ${form.data.body})
					on conflict (user_id, lesson_id) do update set body = excluded.body, updated_at = now()`
				: tx`delete from lesson_notes where user_id = ${userId} and lesson_id = ${params.lesson}`
		);
		return { noted: true };
	},

	// A new or changed review waits for staff approval before the public sees it.
	review: async ({ locals, params, request }) => {
		const form = await parseForm(Review, request);
		if ('invalid' in form) return form.invalid;
		const user = locals.user!;
		await locals.db((tx) => tx`
			insert into course_reviews (user_id, course_id, rating, body, author_name)
			select ${user.id}, c.id, ${form.data.rating}, ${form.data.body}, ${user.name} from courses c where c.slug = ${params.slug}
			on conflict (user_id, course_id) do update
				set rating = excluded.rating, body = excluded.body, author_name = excluded.author_name, approved = false`);
		return { reviewed: true };
	},

	complete: async ({ locals, params }) => {
		await completeLessonIfDone(locals.user!.id, params.lesson);
	},

	quiz: async ({ locals, params, request }) => {
		const userId = locals.user!.id;
		const data = await request.formData();
		const result = await locals.db(async (tx) => {
			// Joined to the student's enrollment, so a quiz from a course they aren't in can't be answered.
			const questions = await tx<{ id: string; correct: number }[]>`
				select q.id, q.correct from quiz_questions q
				join lessons l on l.id = q.lesson_id
				join enrollments e on e.course_id = l.course_id and e.user_id = ${userId}
				where q.lesson_id = ${params.lesson} order by q.position, q.id`;
			if (!questions.length) return null;
			const answers = questions.map((q) => {
				const value = data.get(`q_${q.id}`);
				return typeof value === 'string' && value !== '' ? Number(value) : undefined;
			});
			const graded = gradeQuiz(questions.map((q) => q.correct), answers);
			await tx`insert into quiz_attempts (user_id, lesson_id, score, total, passed)
				values (${userId}, ${params.lesson}, ${graded.score}, ${graded.total}, ${graded.passed})`;
			return graded;
		});
		if (!result) return fail(404, { code: 'not_found' });
		if (result.passed) await completeLessonIfDone(userId, params.lesson);
		return { quiz: result };
	},

	submit: async ({ locals, params, request }) => {
		const userId = locals.user!.id;
		const form = await parseForm(v.object({ note: text(1000) }), request);
		if ('invalid' in form) return form.invalid;
		const file = chosenFile(form.formData.get('file'));
		if (!file) return fail(400, { code: 'file_missing' });

		const [state] = await locals.db((tx) => tx<{ file_key: string | null; reviewed_at: Date | null }[]>`
			select s.file_key, s.reviewed_at
			from lessons l
			join enrollments e on e.course_id = l.course_id and e.user_id = ${userId}
			left join submissions s on s.lesson_id = l.id and s.user_id = ${userId}
			where l.id = ${params.lesson} and l.assignment <> ''`);
		if (!state) return fail(404, { code: 'not_found' });
		if (state.reviewed_at) return fail(409, { code: 'already_reviewed' });

		const saved = await saveUpload(file, `submissions/${userId}`, 'document');
		if ('error' in saved) return fail(400, { code: saved.error });
		await locals.db((tx) => tx`
			insert into submissions (user_id, lesson_id, file_key, file_name, note)
			values (${userId}, ${params.lesson}, ${saved.key}, ${saved.name}, ${form.data.note})
			on conflict (user_id, lesson_id) do update
				set file_key = excluded.file_key, file_name = excluded.file_name, note = excluded.note, created_at = now()`);
		if (state.file_key) await deleteFile(state.file_key);
		await completeLessonIfDone(userId, params.lesson);
		return { submitted: true };
	}
};
