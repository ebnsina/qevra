import { redirect } from '@sveltejs/kit';

// Sends the student to the first lesson they haven't finished (or the first one, when all are done).
// A course that has no lessons yet shows this page instead: what is coming, and any live classes.
export async function load({ locals, params }) {
	const userId = locals.user!.id;
	return locals.db(async (tx) => {
		const [course] = await tx<{ id: string; slug: string; title: string; summary: string; enrolled: boolean }[]>`
			select c.id, c.slug, c.title, c.summary,
				exists (select 1 from enrollments e where e.course_id = c.id and e.user_id = ${userId}) as enrolled
			from courses c where c.slug = ${params.slug}`;
		// Staff can open any course to see it as a student does.
		if (!course || (!course.enrolled && locals.user!.role !== 'admin')) redirect(303, `/portal/enroll/${params.slug}`);

		const lessons = await tx<{ id: string; done: boolean }[]>`
			select l.id, p.lesson_id is not null as done
			from lessons l
			join modules m on m.id = l.module_id
			left join lesson_progress p on p.lesson_id = l.id and p.user_id = ${userId}
			where l.course_id = ${course.id}
			order by m.position, l.position, l.title`;
		const next = lessons.find((l) => !l.done) ?? lessons[0];
		if (next) redirect(303, `/portal/courses/${course.slug}/${next.id}`);

		const live = await tx<{ id: string; title: string; starts_at: Date; meeting_url: string }[]>`
			select id, title, starts_at, meeting_url from live_classes
			where course_id = ${course.id} and starts_at > now() - interval '2 hours' order by starts_at`;
		return { course, live };
	});
}
