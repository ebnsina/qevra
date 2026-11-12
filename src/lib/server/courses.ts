import type { Tx } from './db.ts';

export interface CourseSummary {
	slug: string;
	title: string;
	summary: string;
	level: string;
	price: number;
	image_key: string | null;
	enrollment_open: boolean;
	lessons: number;
}

export function listPublishedCourses(tx: Tx, limit = 100) {
	return tx<CourseSummary[]>`
		select c.slug, c.title, c.summary, c.level, c.price, c.image_key, c.enrollment_open,
			(select count(*)::int from lessons l where l.course_id = c.id) as lessons
		from courses c
		where c.published
		order by c.position, c.created_at
		limit ${limit}`;
}
