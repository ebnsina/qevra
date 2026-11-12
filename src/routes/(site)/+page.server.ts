import { getContent } from '#lib/server/content.ts';
import { listPublishedCourses } from '#lib/server/courses.ts';

export async function load({ locals }) {
	return locals.db(async (tx) => {
		const { home } = await getContent(tx);
		const courses = await listPublishedCourses(tx, 6);
		const partners = await tx<{ id: string; name: string; image_key: string }[]>`
			select id, name, image_key from partners order by position, name`;
		const reviews = await tx<{ id: string; name: string; affiliation: string; body: string }[]>`
			select id, name, affiliation, body from reviews order by position, name limit 3`;
		const resources = await tx<{ id: string; title: string; description: string; file_key: string; file_name: string }[]>`
			select id, title, description, file_key, file_name from resources order by position, title limit 3`;
		const posts = await tx<{ slug: string; title: string; excerpt: string; image_key: string | null; published_at: Date }[]>`
			select slug, title, excerpt, image_key, published_at from posts
			where published_at <= now() order by published_at desc limit 3`;
		return { home, courses, partners, reviews, resources, posts };
	});
}
