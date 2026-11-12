export async function load({ locals }) {
	const posts = await locals.db((tx) => tx<{ slug: string; title: string; excerpt: string; image_key: string | null; published_at: Date }[]>`
		select slug, title, excerpt, image_key, published_at from posts
		where published_at <= now() order by published_at desc`);
	return { posts };
}
