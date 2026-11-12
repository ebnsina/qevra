import { error } from '@sveltejs/kit';
import { renderMarkdown } from '#lib/server/markdown.ts';

export async function load({ locals, params }) {
	const [post] = await locals.db((tx) => tx<{ title: string; excerpt: string; body: string; image_key: string | null; published_at: Date }[]>`
		select title, excerpt, body, image_key, published_at from posts
		where slug = ${params.slug} and published_at <= now()`);
	if (!post) error(404, 'Post not found');
	const { body, ...rest } = post;
	return { post: rest, html: renderMarkdown(body) };
}
