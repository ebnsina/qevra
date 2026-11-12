import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { deleteRow, isFailure, saveRow, uploadFrom } from '#lib/server/admin.ts';
import { UUID, checkbox, parseForm, requiredText, slug, text } from '#lib/server/form.ts';
import { renderMarkdown } from '#lib/server/markdown.ts';

const Post = v.object({ title: requiredText(160), slug, excerpt: text(300), body: text(100_000), published: checkbox });

interface Post {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	body: string;
	image_key: string | null;
	published_at: Date | null;
	published: boolean;
}

// `new` writes a post; anything else is the id of the one to edit.
export async function load({ locals, params }) {
	if (params.id === 'new') return { post: null };
	if (!UUID.test(params.id)) error(404, 'Post not found');
	const [post] = await locals.db((tx) => tx<Post[]>`
		select id, title, slug, excerpt, body, image_key, published_at, published_at is not null as published
		from posts where id = ${params.id}`);
	if (!post) error(404, 'Post not found');
	// The editor works in HTML; older posts were written in Markdown.
	return { post: { ...post, body: renderMarkdown(post.body) } };
}

export const actions = {
	save: async ({ locals, params, request }) => {
		const form = await parseForm(Post, request);
		if ('invalid' in form) return form.invalid;
		const id = params.id === 'new' ? null : params.id;
		const { published, ...row } = form.data;
		const upload = await uploadFrom(form.formData, 'image_key', 'public/posts', 'image');
		if (upload && 'error' in upload) return fail(400, { code: upload.error });
		// A post keeps its first publish date when edited later.
		const [existing] = id ? await locals.db((tx) => tx<{ published_at: Date | null }[]>`select published_at from posts where id = ${id}`) : [];
		const published_at = published ? (existing?.published_at ?? new Date()) : null;
		const saved = await saveRow(locals.db, 'posts', id, { ...row, published_at, ...(upload ? { image_key: upload.key } : {}) }, 'image_key');
		if (isFailure(saved)) return saved;
		if (!id) redirect(303, `/admin/posts/${saved.id}?saved`);
		return { saved: true };
	},
	delete: async ({ locals, params }) => {
		const form = new FormData();
		form.set('id', params.id);
		const failed = await deleteRow(locals.db, 'posts', form, 'image_key');
		if (failed) return failed;
		redirect(303, '/admin/posts');
	}
};
