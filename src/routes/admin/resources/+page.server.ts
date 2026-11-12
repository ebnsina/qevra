import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { deleteRow, saveRow, uploadFrom } from '#lib/server/admin.ts';
import { optionalId, parseForm, requiredText, text, wholeNumber } from '#lib/server/form.ts';

const Resource = v.object({ id: optionalId, title: requiredText(120), description: text(300), position: wholeNumber });

export async function load({ locals }) {
	const resources = await locals.db((tx) => tx<{ id: string; title: string; description: string; file_key: string; file_name: string; position: number }[]>`
		select id, title, description, file_key, file_name, position from resources order by position, title`);
	return { resources };
}

export const actions = {
	save: async ({ locals, request }) => {
		const form = await parseForm(Resource, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		const upload = await uploadFrom(form.formData, 'file_key', 'public/resources', 'document');
		if (upload && 'error' in upload) return fail(400, { code: upload.error });
		if (!id && !upload) return fail(400, { code: 'file_missing' });
		const saved = upload ? { ...row, file_key: upload.key, file_name: upload.name } : row;
		return saveRow(locals.db, 'resources', id, saved, 'file_key');
	},
	delete: async ({ locals, request }) => deleteRow(locals.db, 'resources', await request.formData(), 'file_key')
};
