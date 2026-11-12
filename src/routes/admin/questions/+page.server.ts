import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { id, parseForm, requiredText } from '#lib/server/form.ts';

interface Post {
	id: string;
	parent_id: string | null;
	author_name: string;
	by_staff: boolean;
	body: string;
	created_at: Date;
	lesson_id: string;
	lesson: string;
	course: string;
	slug: string;
}

export async function load({ locals, url }) {
	const show = url.searchParams.get('show') === 'all' ? 'all' : 'open';
	const posts = await locals.db((tx) => tx<Post[]>`
		select p.id, p.parent_id, p.author_name, p.by_staff, p.body, p.created_at, p.lesson_id,
			l.title as lesson, c.title as course, c.slug
		from lesson_posts p
		join lessons l on l.id = p.lesson_id
		join courses c on c.id = l.course_id
		order by p.created_at desc limit 1000`);
	// A question is answered once someone on staff has replied to it.
	const questions = posts
		.filter((p) => !p.parent_id)
		.map((question) => {
			const replies = posts.filter((p) => p.parent_id === question.id).reverse();
			return { ...question, replies, answered: replies.some((r) => r.by_staff) };
		})
		.filter((q) => show === 'all' || !q.answered);
	return { questions, show };
}

export const actions = {
	answer: async ({ locals, request }) => {
		const form = await parseForm(v.object({ id, body: requiredText(4000) }), request);
		if ('invalid' in form) return form.invalid;
		const user = locals.user!;
		const [posted] = await locals.db((tx) => tx`
			insert into lesson_posts (lesson_id, user_id, parent_id, author_name, by_staff, body)
			select q.lesson_id, ${user.id}, q.id, ${user.name}, true, ${form.data.body}
			from lesson_posts q where q.id = ${form.data.id} and q.parent_id is null
			returning id`);
		if (!posted) return fail(404, { code: 'not_found' });
	},
	delete: async ({ locals, request }) => {
		const form = await parseForm(v.object({ id }), request);
		if ('invalid' in form) return form.invalid;
		await locals.db((tx) => tx`delete from lesson_posts where id = ${form.data.id}`);
	}
};
