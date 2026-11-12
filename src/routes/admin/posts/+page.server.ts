import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { deleteRow, saveRow, uploadFrom } from '#lib/server/admin.ts';
import { checkbox, optionalId, parseForm, requiredText, slug, text } from '#lib/server/form.ts';

const Post = v.object({
	id: optionalId,
	title: requiredText(160),
	slug,
	excerpt: text(300),
	body: text(50_000),
	published: checkbox
});

export async function load({ locals }) {
	const posts = await locals.db((tx) => tx<{ id: string; title: string; slug: string; excerpt: string; body: string; image_key: string | null; published_at: Date | null; published: boolean }[]>`
		select id, title, slug, excerpt, body, image_key, published_at, published_at is not null as published
		from posts order by coalesce(published_at, created_at) desc`);
	return { posts };
}

export const actions = {
	save: async ({ locals, request }) => {
		const form = await parseForm(Post, request);
		if ('invalid' in form) return form.invalid;
		const { id, published, ...row } = form.data;
		const upload = await uploadFrom(form.formData, 'image_key', 'public/posts', 'image');
		if (upload && 'error' in upload) return fail(400, { code: upload.error });
		// A post keeps its first publish date when edited later.
		const [existing] = id ? await locals.db((tx) => tx<{ published_at: Date | null }[]>`select published_at from posts where id = ${id}`) : [];
		const published_at = published ? (existing?.published_at ?? new Date()) : null;
		return saveRow(locals.db, 'posts', id, { ...row, published_at, ...(upload ? { image_key: upload.key } : {}) }, 'image_key');
	},
	delete: async ({ locals, request }) => deleteRow(locals.db, 'posts', await request.formData(), 'image_key')
};
