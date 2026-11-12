import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { deleteRow, isFailure, saveRow, uploadFrom } from '#lib/server/admin.ts';
import { UUID, checkbox, optionalNumber, parseForm, requiredText, slug, text, wholeNumber } from '#lib/server/form.ts';
import { renderMarkdown } from '#lib/server/markdown.ts';

const Course = v.object({
	title: requiredText(120),
	slug,
	level: text(40),
	price: wholeNumber,
	regular_price: optionalNumber,
	summary: text(300),
	outcomes: text(2000),
	requirements: text(1000),
	description: text(100_000),
	published: checkbox,
	enrollment_open: checkbox,
	position: wholeNumber
});

interface Course {
	id: string;
	title: string;
	slug: string;
	level: string;
	price: number;
	regular_price: number | null;
	summary: string;
	outcomes: string;
	requirements: string;
	description: string;
	image_key: string | null;
	published: boolean;
	enrollment_open: boolean;
	position: number;
}

export async function load({ locals, params }) {
	if (params.id === 'new') {
		const [{ next }] = await locals.db((tx) => tx<{ next: number }[]>`select coalesce(max(position) + 1, 0)::int as next from courses`);
		return { course: null, next };
	}
	if (!UUID.test(params.id)) error(404, 'Course not found');
	const [course] = await locals.db((tx) => tx<Course[]>`
		select id, title, slug, level, price, regular_price, summary, outcomes, requirements, description, image_key,
			published, enrollment_open, position
		from courses where id = ${params.id}`);
	if (!course) error(404, 'Course not found');
	return { course: { ...course, description: renderMarkdown(course.description) }, next: course.position };
}

export const actions = {
	save: async ({ locals, params, request }) => {
		const form = await parseForm(Course, request);
		if ('invalid' in form) return form.invalid;
		const id = params.id === 'new' ? null : params.id;
		const upload = await uploadFrom(form.formData, 'image_key', 'public/courses', 'image');
		if (upload && 'error' in upload) return fail(400, { code: upload.error });
		const saved = await saveRow(locals.db, 'courses', id, upload ? { ...form.data, image_key: upload.key } : form.data, 'image_key');
		if (isFailure(saved)) return saved;
		if (!id) redirect(303, `/admin/courses/${saved.id}/edit?saved`);
		return { saved: true };
	},
	delete: async ({ locals, params }) => {
		const form = new FormData();
		form.set('id', params.id);
		const failed = await deleteRow(locals.db, 'courses', form, 'image_key');
		if (failed) return failed;
		redirect(303, '/admin/courses');
	}
};
