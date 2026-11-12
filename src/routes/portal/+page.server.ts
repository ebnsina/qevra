// The student's first screen: where to continue, their numbers, their last two weeks, and what is new.
const DAYS = 14;

export async function load({ locals }) {
	const userId = locals.user!.id;
	return locals.db(async (tx) => {
		const courses = await tx<{ slug: string; title: string; summary: string; completed_at: Date | null; total: number; done: number; last_active: Date | null; next_lesson: string | null }[]>`
			select c.slug, c.title, c.summary, e.completed_at,
				(select count(*)::int from lessons l where l.course_id = c.id) as total,
				(select count(*)::int from lesson_progress p join lessons l on l.id = p.lesson_id
					where l.course_id = c.id and p.user_id = ${userId}) as done,
				(select max(p.completed_at) from lesson_progress p join lessons l on l.id = p.lesson_id
					where l.course_id = c.id and p.user_id = ${userId}) as last_active,
				(select l.title from lessons l join modules m on m.id = l.module_id
					where l.course_id = c.id and not exists (
						select 1 from lesson_progress p where p.lesson_id = l.id and p.user_id = ${userId})
					order by m.position, l.position, l.title limit 1) as next_lesson
			from enrollments e join courses c on c.id = e.course_id
			where e.user_id = ${userId}
			order by e.created_at desc`;
		const [totals] = await tx<{ lessons: number; quizzes: number; certificates: number }[]>`
			select
				(select count(*)::int from lesson_progress where user_id = ${userId}) as lessons,
				(select count(distinct lesson_id)::int from quiz_attempts where user_id = ${userId} and passed) as quizzes,
				(select count(*)::int from certificates where user_id = ${userId}) as certificates`;
		const days = await tx<{ day: Date; lessons: number }[]>`
			select d::date as day,
				(select count(*)::int from lesson_progress p where p.user_id = ${userId} and p.completed_at::date = d::date) as lessons
			from generate_series(current_date - ${DAYS - 1}::int, current_date, interval '1 day') d
			order by d`;

		const live = await tx<{ id: string; title: string; starts_at: Date; meeting_url: string; course: string }[]>`
			select lc.id, lc.title, lc.starts_at, lc.meeting_url, c.title as course
			from live_classes lc
			join courses c on c.id = lc.course_id
			join enrollments e on e.course_id = c.id and e.user_id = ${userId}
			where lc.starts_at > now() - interval '2 hours'
			order by lc.starts_at limit 5`;
		const [{ pending }] = await tx<{ pending: number }[]>`
			select count(*)::int as pending from payments where user_id = ${userId} and status = 'pending'`;
		// Row-level security limits these to the courses the student is in; the join keeps staff to their own too.
		const announcements = await tx<{ id: string; title: string; body: string; created_at: Date; course: string }[]>`
			select a.id, a.title, a.body, a.created_at, c.title as course
			from announcements a
			join courses c on c.id = a.course_id
			join enrollments e on e.course_id = c.id and e.user_id = ${userId}
			order by a.created_at desc limit 5`;
		// The teacher's replies to this student's questions.
		const answers = await tx<{ id: string; body: string; created_at: Date; lesson: string; lesson_id: string; slug: string }[]>`
			select r.id, r.body, r.created_at, l.title as lesson, l.id as lesson_id, c.slug
			from lesson_posts r
			join lesson_posts q on q.id = r.parent_id and q.user_id = ${userId}
			join lessons l on l.id = r.lesson_id
			join courses c on c.id = l.course_id
			where r.by_staff order by r.created_at desc limit 4`;
		const finished = await tx<{ lesson_id: string; lesson: string; course: string; slug: string; completed_at: Date }[]>`
			select l.id as lesson_id, l.title as lesson, c.title as course, c.slug, p.completed_at
			from lesson_progress p join lessons l on l.id = p.lesson_id join courses c on c.id = l.course_id
			where p.user_id = ${userId} order by p.completed_at desc limit 5`;

		// Continue with the course they touched last; a course not started yet counts from when they joined.
		const current = courses
			.filter((c) => !c.completed_at && c.total > 0)
			.sort((a, b) => (b.last_active?.getTime() ?? 0) - (a.last_active?.getTime() ?? 0))[0];
		return { courses, current: current ?? null, totals, days, live, pending, announcements, answers, finished };
	});
}
