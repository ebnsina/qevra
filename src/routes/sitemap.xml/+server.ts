export async function GET({ url, locals }) {
	const paths = await locals.db(async (tx) => {
		const courses = await tx<{ slug: string }[]>`select slug from courses where published`;
		const posts = await tx<{ slug: string }[]>`select slug from posts where published_at <= now()`;
		const pages = await tx<{ slug: string }[]>`select slug from pages`;
		return [
			'',
			'/courses',
			'/reviews',
			'/resources',
			'/blog',
			...courses.map((c) => `/courses/${c.slug}`),
			...posts.map((p) => `/blog/${p.slug}`),
			...pages.map((p) => `/${p.slug}`)
		];
	});
	const urls = paths.map((path) => `<url><loc>${url.origin}${path}</loc></url>`).join('');
	return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
		headers: { 'content-type': 'application/xml' }
	});
}
