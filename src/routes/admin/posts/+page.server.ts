export async function load({ locals }) {
	const posts = await locals.db((tx) => tx<{ id: string; title: string; slug: string; excerpt: string; body: string; image_key: string | null; published_at: Date | null; published: boolean }[]>`
		select id, title, slug, excerpt, body, image_key, published_at, published_at is not null as published
		from posts order by coalesce(published_at, created_at) desc`);
	return { posts };
}
