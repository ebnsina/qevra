export async function load({ locals }) {
	const [counts] = await locals.db((tx) => tx<{ payments: number; submissions: number; questions: number; reviews: number }[]>`
		select
			(select count(*)::int from payments where status = 'pending') as payments,
			(select count(*)::int from submissions where reviewed_at is null) as submissions,
			(select count(*)::int from lesson_posts q where q.parent_id is null
				and not exists (select 1 from lesson_posts r where r.parent_id = q.id and r.by_staff)) as questions,
			(select count(*)::int from course_reviews where not approved) as reviews`);
	return { waiting: counts };
}
