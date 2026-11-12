import { error } from '@sveltejs/kit';
import { renderMarkdown } from '#lib/server/markdown.ts';

export async function load({ locals, params }) {
	const [page] = await locals.db((tx) => tx<{ slug: string; title: string; body: string }[]>`
		select slug, title, body from pages where slug = ${params.page}`);
	if (!page) error(404, 'Page not found');
	return { slug: page.slug, title: page.title, html: renderMarkdown(page.body), text: page.body.slice(0, 150) };
}
