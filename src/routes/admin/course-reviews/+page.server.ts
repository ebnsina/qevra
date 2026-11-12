import * as v from 'valibot';
import { id, parseForm } from '#lib/server/form.ts';

export async function load({ locals, url }) {
	const show = url.searchParams.get('show') === 'all' ? 'all' : 'waiting';
	const reviews = await locals.db((tx) => tx<{ id: string; author_name: string; course: string; rating: number; body: string; approved: boolean; created_at: Date }[]>`
		select r.id, r.author_name, c.title as course, r.rating, r.body, r.approved, r.created_at
		from course_reviews r join courses c on c.id = r.course_id
		${show === 'waiting' ? tx`where not r.approved` : tx``}
		order by r.created_at desc limit 500`);
	return { reviews, show };
}

const Target = v.object({ id });

export const actions = {
	// Approved reviews show on the course page and count toward its star rating.
	approve: async ({ locals, request }) => {
		const form = await parseForm(Target, request);
		if ('invalid' in form) return form.invalid;
		await locals.db((tx) => tx`update course_reviews set approved = true where id = ${form.data.id}`);
	},
	hide: async ({ locals, request }) => {
		const form = await parseForm(Target, request);
		if ('invalid' in form) return form.invalid;
		await locals.db((tx) => tx`update course_reviews set approved = false where id = ${form.data.id}`);
	},
	delete: async ({ locals, request }) => {
		const form = await parseForm(Target, request);
		if ('invalid' in form) return form.invalid;
		await locals.db((tx) => tx`delete from course_reviews where id = ${form.data.id}`);
	}
};
