import type { Tx } from './db.ts';

export interface CourseSummary {
	slug: string;
	title: string;
	summary: string;
	level: string;
	price: number;
	image_key: string | null;
	enrollment_open: boolean;
	regular_price: number | null;
	lessons: number;
	/** Average of the approved student reviews, and how many there are. */
	rating: number | null;
	reviews: number;
}

export function listPublishedCourses(tx: Tx, limit = 100) {
	return tx<CourseSummary[]>`
		select c.slug, c.title, c.summary, c.level, c.price, c.image_key, c.enrollment_open, c.regular_price,
			(select round(avg(r.rating), 1)::float from course_reviews r where r.course_id = c.id and r.approved) as rating,
			(select count(*)::int from course_reviews r where r.course_id = c.id and r.approved) as reviews,
			(select count(*)::int from lessons l where l.course_id = c.id) as lessons
		from courses c
		where c.published
		order by c.position, c.created_at
		limit ${limit}`;
}
