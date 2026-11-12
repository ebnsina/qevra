import { fail } from '@sveltejs/kit';
import { HomeSchema, SettingsSchema } from '#lib/content.ts';
import { uploadFrom } from '#lib/server/admin.ts';
import { getContent } from '#lib/server/content.ts';
import { parseForm } from '#lib/server/form.ts';
import { deleteFile } from '#lib/server/storage.ts';

export async function load({ locals }) {
	return locals.db(getContent);
}

function saveContent(locals: App.Locals, key: 'settings' | 'home', value: object) {
	return locals.db((tx) => tx`
		insert into site_content (key, value) values (${key}, ${tx.json(value as never)})
		on conflict (key) do update set value = excluded.value`);
}

export const actions = {
	settings: async ({ locals, request }) => {
		const form = await parseForm(SettingsSchema, request);
		if ('invalid' in form) return form.invalid;
		const upload = await uploadFrom(form.formData, 'logo_key', 'public/site', 'image');
		if (upload && 'error' in upload) return fail(400, { code: upload.error });
		const { settings: old } = await locals.db(getContent);
		await saveContent(locals, 'settings', { ...form.data, logo_key: upload ? upload.key : old.logo_key });
		if (upload && old.logo_key) await deleteFile(old.logo_key);
		return { saved: 'settings' as const };
	},

	home: async ({ locals, request }) => {
		const form = await parseForm(HomeSchema, request);
		if ('invalid' in form) return form.invalid;
		await saveContent(locals, 'home', form.data);
		return { saved: 'home' as const };
	}
};
