import { error, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { deleteRow, isFailure, saveRow } from '#lib/server/admin.ts';
import { UUID, parseForm, requiredText, slug, text } from '#lib/server/form.ts';
import { renderMarkdown } from '#lib/server/markdown.ts';

const Page = v.object({ title: requiredText(120), slug, body: text(100_000) });

export async function load({ locals, params }) {
	if (params.id === 'new') return { page: null };
	if (!UUID.test(params.id)) error(404, 'Page not found');
	const [page] = await locals.db((tx) => tx<{ id: string; title: string; slug: string; body: string }[]>`
		select id, title, slug, body from pages where id = ${params.id}`);
	if (!page) error(404, 'Page not found');
	return { page: { ...page, body: renderMarkdown(page.body) } };
}

export const actions = {
	save: async ({ locals, params, request }) => {
		const form = await parseForm(Page, request);
		if ('invalid' in form) return form.invalid;
		const id = params.id === 'new' ? null : params.id;
		const saved = await saveRow(locals.db, 'pages', id, form.data);
		if (isFailure(saved)) return saved;
		if (!id) redirect(303, `/admin/pages/${saved.id}?saved`);
		return { saved: true };
	},
	delete: async ({ locals, params }) => {
		const form = new FormData();
		form.set('id', params.id);
		const failed = await deleteRow(locals.db, 'pages', form);
		if (failed) return failed;
		redirect(303, '/admin/pages');
	}
};
