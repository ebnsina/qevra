export function GET({ url }) {
	return new Response(`User-agent: *\nDisallow: /portal\nDisallow: /admin\n\nSitemap: ${url.origin}/sitemap.xml\n`);
}
