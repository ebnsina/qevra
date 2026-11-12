export async function load({ locals }) {
	const courses = await locals.db((tx) => tx<{
		id: string; title: string; slug: string; level: string; price: number; regular_price: number | null; summary: string; outcomes: string; requirements: string;
		description: string; image_key: string | null; published: boolean; enrollment_open: boolean; position: number; lessons: number; students: number;
	}[]>`
		select c.id, c.title, c.slug, c.level, c.price, c.regular_price, c.summary, c.outcomes, c.requirements, c.description, c.image_key,
			c.published, c.enrollment_open, c.position,
			(select count(*)::int from lessons l where l.course_id = c.id) as lessons,
			(select count(*)::int from enrollments e where e.course_id = c.id) as students
		from courses c order by c.position, c.created_at`);
	return { courses };
}
