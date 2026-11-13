import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { setStudentPassword } from '#lib/server/auth.ts';
import { id, parseForm } from '#lib/server/form.ts';

// shortcut: loads every student and enrollment at once; add paging and server search past a few thousand students.
export async function load({ locals }) {
	return locals.db(async (tx) => {
		const students = await tx<{ id: string; name: string; email: string; phone: string; created_at: Date }[]>`
			select id, name, email, phone, created_at from users where role = 'student' order by created_at desc`;
		const enrollments = await tx<{ user_id: string; course_id: string; course: string; created_at: Date; completed_at: Date | null; total: number; done: number }[]>`
			select e.user_id, e.course_id, c.title as course, e.created_at, e.completed_at,
				(select count(*)::int from lessons l where l.course_id = c.id) as total,
				(select count(*)::int from lesson_progress p join lessons l on l.id = p.lesson_id
					where l.course_id = c.id and p.user_id = e.user_id) as done
			from enrollments e join courses c on c.id = e.course_id order by e.created_at desc`;
		const courses = await tx<{ id: string; title: string }[]>`select id, title from courses order by position, title`;
		return { students, enrollments, courses };
	});
}

export const actions = {
	// Opens a course for a student without a payment (a scholarship, a cash payment).
	enroll: async ({ locals, request }) => {
		const form = await parseForm(v.object({ user_id: id, course_id: id }), request);
		if ('invalid' in form) return form.invalid;
		const [added] = await locals.db((tx) => tx`
			insert into enrollments (user_id, course_id) values (${form.data.user_id}, ${form.data.course_id})
			on conflict (user_id, course_id) do nothing returning id`);
		if (!added) return fail(409, { code: 'already_enrolled' });
		return { enrolled: true };
	},

	// For a student who can't sign in: staff set a new password and tell it to them.
	password: async ({ request }) => {
		const form = await parseForm(
			v.object({ user_id: id, new_password: v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters'), v.maxLength(200)) }),
			request
		);
		if ('invalid' in form) return form.invalid;
		if (!(await setStudentPassword(form.data.user_id, form.data.new_password))) return fail(404, { code: 'not_found' });
		return { passwordSet: true };
	}
};
