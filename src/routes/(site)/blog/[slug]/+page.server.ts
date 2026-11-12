import { error } from '@sveltejs/kit';
import { renderMarkdown } from '#lib/server/markdown.ts';

interface Card { slug: string; title: string; excerpt: string; image_key: string | null; published_at: Date; minutes: number }

export async function load({ locals, params }) {
	return locals.db(async (tx) => {
		const [post] = await tx<(Card & { body: string })[]>`
			select slug, title, excerpt, body, image_key, published_at, greatest(1, ceil(array_length(regexp_split_to_array(trim(body), '\\s+'), 1) / 200.0))::int as minutes
			from posts where slug = ${params.slug} and published_at <= now()`;
		if (!post) error(404, 'Post not found');
		const more = await tx<Card[]>`
			select slug, title, excerpt, image_key, published_at, greatest(1, ceil(array_length(regexp_split_to_array(trim(body), '\\s+'), 1) / 200.0))::int as minutes
			from posts where slug <> ${params.slug} and published_at <= now() order by published_at desc limit 3`;
		const { body, ...rest } = post;
		return { post: rest, html: renderMarkdown(body), more };
	});
}
