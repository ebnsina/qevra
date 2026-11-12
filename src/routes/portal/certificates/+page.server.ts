export async function load({ locals }) {
	const certificates = await locals.db((tx) => tx<{ code: string; course: string; issued_at: Date }[]>`
		select ce.code, c.title as course, ce.issued_at
		from certificates ce join courses c on c.id = ce.course_id
		where ce.user_id = ${locals.user!.id}
		order by ce.issued_at desc`);
	return { certificates };
}
