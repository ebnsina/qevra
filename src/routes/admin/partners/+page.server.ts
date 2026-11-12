import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { deleteRow, saveRow, uploadFrom } from '#lib/server/admin.ts';
import { optionalId, parseForm, requiredText, wholeNumber } from '#lib/server/form.ts';

const Partner = v.object({ id: optionalId, name: requiredText(120), position: wholeNumber });

export async function load({ locals }) {
	const partners = await locals.db((tx) => tx<{ id: string; name: string; image_key: string; position: number }[]>`
		select id, name, image_key, position from partners order by position, name`);
	return { partners };
}

export const actions = {
	save: async ({ locals, request }) => {
		const form = await parseForm(Partner, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		const upload = await uploadFrom(form.formData, 'image_key', 'public/partners', 'image');
		if (upload && 'error' in upload) return fail(400, { code: upload.error });
		if (!id && !upload) return fail(400, { code: 'file_missing' });
		return saveRow(locals.db, 'partners', id, { ...row, ...(upload ? { image_key: upload.key } : {}) }, 'image_key');
	},
	delete: async ({ locals, request }) => deleteRow(locals.db, 'partners', await request.formData(), 'image_key')
};
