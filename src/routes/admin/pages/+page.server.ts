export async function load({ locals }) {
	const pages = await locals.db((tx) => tx<{ id: string; title: string; slug: string; body: string }[]>`
		select id, title, slug, body from pages order by title`);
	return { pages };
}
