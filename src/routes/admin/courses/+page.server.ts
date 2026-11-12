import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { deleteRow, saveRow, uploadFrom } from '#lib/server/admin.ts';
import { checkbox, optionalId, parseForm, requiredText, slug, text, wholeNumber } from '#lib/server/form.ts';

const Course = v.object({
	id: optionalId,
	title: requiredText(120),
	slug,
	level: text(40),
	price: wholeNumber,
	summary: text(300),
	outcomes: text(2000),
	requirements: text(1000),
	description: text(20_000),
	published: checkbox,
	enrollment_open: checkbox,
	position: wholeNumber
});

export async function load({ locals }) {
	const courses = await locals.db((tx) => tx<{
		id: string; title: string; slug: string; level: string; price: number; summary: string; outcomes: string; requirements: string;
		description: string; image_key: string | null; published: boolean; enrollment_open: boolean; position: number; lessons: number; students: number;
	}[]>`
		select c.id, c.title, c.slug, c.level, c.price, c.summary, c.outcomes, c.requirements, c.description, c.image_key,
			c.published, c.enrollment_open, c.position,
			(select count(*)::int from lessons l where l.course_id = c.id) as lessons,
			(select count(*)::int from enrollments e where e.course_id = c.id) as students
		from courses c order by c.position, c.created_at`);
	return { courses };
}

export const actions = {
	save: async ({ locals, request }) => {
		const form = await parseForm(Course, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		const upload = await uploadFrom(form.formData, 'image_key', 'public/courses', 'image');
		if (upload && 'error' in upload) return fail(400, { code: upload.error });
		return saveRow(locals.db, 'courses', id, upload ? { ...row, image_key: upload.key } : row, 'image_key');
	},
	delete: async ({ locals, request }) => deleteRow(locals.db, 'courses', await request.formData(), 'image_key')
};
