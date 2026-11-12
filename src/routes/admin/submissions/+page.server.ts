import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { id, parseForm, text } from '#lib/server/form.ts';

const Review = v.object({ id, grade: text(40), feedback: text(2000) });

export async function load({ locals, url }) {
	const show = url.searchParams.get('show') === 'all' ? 'all' : 'waiting';
	const submissions = await locals.db((tx) => tx<{
		id: string; student: string; email: string; course: string; lesson: string; assignment: string; file_key: string; file_name: string;
		note: string; grade: string; feedback: string; created_at: Date; reviewed_at: Date | null;
	}[]>`
		select s.id, u.name as student, u.email, c.title as course, l.title as lesson, l.assignment, s.file_key, s.file_name,
			s.note, s.grade, s.feedback, s.created_at, s.reviewed_at
		from submissions s
		join users u on u.id = s.user_id
		join lessons l on l.id = s.lesson_id
		join courses c on c.id = l.course_id
		${show === 'waiting' ? tx`where s.reviewed_at is null` : tx``}
		order by s.created_at desc limit 500`);
	return { submissions, show };
}

export const actions = {
	review: async ({ locals, request }) => {
		const form = await parseForm(Review, request);
		if ('invalid' in form) return form.invalid;
		const [saved] = await locals.db((tx) => tx`
			update submissions set grade = ${form.data.grade}, feedback = ${form.data.feedback}, reviewed_at = now()
			where id = ${form.data.id} returning id`);
		if (!saved) return fail(404, { code: 'not_found' });
	}
};
