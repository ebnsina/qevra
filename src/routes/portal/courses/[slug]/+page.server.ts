import { error, redirect } from '@sveltejs/kit';

// Sends the student to the first lesson they haven't finished (or the first one, when all are done).
export async function load({ locals, params }) {
	const userId = locals.user!.id;
	const lessons = await locals.db((tx) => tx<{ id: string; done: boolean }[]>`
		select l.id, p.lesson_id is not null as done
		from courses c
		join enrollments e on e.course_id = c.id and e.user_id = ${userId}
		join lessons l on l.course_id = c.id
		join modules m on m.id = l.module_id
		left join lesson_progress p on p.lesson_id = l.id and p.user_id = ${userId}
		where c.slug = ${params.slug}
		order by m.position, l.position, l.title`);
	if (!lessons.length) {
		const [enrolled] = await locals.db((tx) => tx`
			select 1 from enrollments e join courses c on c.id = e.course_id
			where c.slug = ${params.slug} and e.user_id = ${userId}`);
		if (!enrolled) redirect(303, `/portal/enroll/${params.slug}`);
		error(404, 'This course has no lessons yet. Check back soon.');
	}
	const next = lessons.find((l) => !l.done) ?? lessons[0];
	redirect(303, `/portal/courses/${params.slug}/${next.id}`);
}
