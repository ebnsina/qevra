export async function load({ locals }) {
	// Reading time: about 200 words a minute.
	const posts = await locals.db((tx) => tx<{ slug: string; title: string; excerpt: string; image_key: string | null; published_at: Date; minutes: number }[]>`
		select slug, title, excerpt, image_key, published_at, greatest(1, ceil(array_length(regexp_split_to_array(trim(body), '\\s+'), 1) / 200.0))::int as minutes
		from posts where published_at <= now() order by published_at desc`);
	return { posts };
}
