export async function load({ locals }) {
	const userId = locals.user!.id;
	return locals.db(async (tx) => {
		const courses = await tx<{ slug: string; title: string; summary: string; completed_at: Date | null; total: number; done: number }[]>`
			select c.slug, c.title, c.summary, e.completed_at,
				(select count(*)::int from lessons l where l.course_id = c.id) as total,
				(select count(*)::int from lesson_progress p join lessons l on l.id = p.lesson_id
					where l.course_id = c.id and p.user_id = ${userId}) as done
			from enrollments e join courses c on c.id = e.course_id
			where e.user_id = ${userId}
			order by e.created_at desc`;
		const live = await tx<{ id: string; title: string; starts_at: Date; meeting_url: string; course: string }[]>`
			select lc.id, lc.title, lc.starts_at, lc.meeting_url, c.title as course
			from live_classes lc
			join courses c on c.id = lc.course_id
			join enrollments e on e.course_id = c.id and e.user_id = ${userId}
			where lc.starts_at > now() - interval '2 hours'
			order by lc.starts_at limit 5`;
		const [{ pending }] = await tx<{ pending: number }[]>`
			select count(*)::int as pending from payments where user_id = ${userId} and status = 'pending'`;
		return { courses, live, pending };
	});
}
