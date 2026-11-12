import * as v from 'valibot';
import { deleteRow, saveRow } from '#lib/server/admin.ts';
import { optionalId, parseForm, requiredText, slug, text } from '#lib/server/form.ts';

const Page = v.object({ id: optionalId, title: requiredText(120), slug, body: text(50_000) });

export async function load({ locals }) {
	const pages = await locals.db((tx) => tx<{ id: string; title: string; slug: string; body: string }[]>`
		select id, title, slug, body from pages order by title`);
	return { pages };
}

export const actions = {
	save: async ({ locals, request }) => {
		const form = await parseForm(Page, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		return saveRow(locals.db, 'pages', id, row);
	},
	delete: async ({ locals, request }) => deleteRow(locals.db, 'pages', await request.formData())
};
