export async function load({ locals }) {
	const notes = await locals.db((tx) => tx<{ lesson_id: string; body: string; updated_at: Date; lesson: string; course: string; slug: string }[]>`
		select n.lesson_id, n.body, n.updated_at, l.title as lesson, c.title as course, c.slug
		from lesson_notes n
		join lessons l on l.id = n.lesson_id
		join courses c on c.id = l.course_id
		where n.user_id = ${locals.user!.id}
		order by c.title, l.position`);
	return { notes };
}
