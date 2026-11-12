// How each course is doing, and where students stop. Numbers only: nothing here is changed.
const DAYS = 30;

export async function load({ locals }) {
	return locals.db(async (tx) => {
		const days = await tx<{ day: Date; enrollments: number; income: number }[]>`
			select d::date as day,
				(select count(*)::int from enrollments e where e.created_at::date = d::date) as enrollments,
				(select coalesce(sum(p.amount), 0)::int from payments p where p.status = 'approved' and p.reviewed_at::date = d::date) as income
			from generate_series(current_date - ${DAYS - 1}::int, current_date, interval '1 day') d
			order by d`;
		const courses = await tx<{
			id: string; title: string; students: number; completed: number; income: number; lessons: number;
			rating: number | null; reviews: number; quiz_tries: number; quiz_passes: number;
		}[]>`
			select c.id, c.title,
				(select count(*)::int from enrollments e where e.course_id = c.id) as students,
				(select count(*)::int from enrollments e where e.course_id = c.id and e.completed_at is not null) as completed,
				(select coalesce(sum(p.amount), 0)::int from payments p where p.course_id = c.id and p.status = 'approved') as income,
				(select count(*)::int from lessons l where l.course_id = c.id) as lessons,
				(select round(avg(r.rating), 1)::float from course_reviews r where r.course_id = c.id and r.approved) as rating,
				(select count(*)::int from course_reviews r where r.course_id = c.id and r.approved) as reviews,
				(select count(*)::int from quiz_attempts a join lessons l on l.id = a.lesson_id where l.course_id = c.id) as quiz_tries,
				(select count(*)::int from quiz_attempts a join lessons l on l.id = a.lesson_id where l.course_id = c.id and a.passed) as quiz_passes
			from courses c order by c.position, c.title`;
		// For each lesson, how many of the course's students have finished it: where the line drops is where they stop.
		const lessons = await tx<{ id: string; course_id: string; title: string; done: number }[]>`
			select l.id, l.course_id, l.title,
				(select count(*)::int from lesson_progress p where p.lesson_id = l.id) as done
			from lessons l join modules m on m.id = l.module_id
			order by m.position, l.position, l.title`;
		return { days, courses, lessons };
	});
}
