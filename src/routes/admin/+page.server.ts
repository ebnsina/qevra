export async function load({ locals }) {
	return locals.db(async (tx) => {
		const [totals] = await tx<{ students: number; enrollments: number; completed: number; income: number }[]>`
			select
				(select count(*)::int from users where role = 'student') as students,
				(select count(*)::int from enrollments) as enrollments,
				(select count(*)::int from enrollments where completed_at is not null) as completed,
				(select coalesce(sum(amount), 0)::int from payments where status = 'approved') as income`;
		const payments = await tx<{ id: string; student: string; course: string; amount: number; created_at: Date }[]>`
			select p.id, u.name as student, c.title as course, p.amount, p.created_at
			from payments p join users u on u.id = p.user_id join courses c on c.id = p.course_id
			where p.status = 'pending' order by p.created_at limit 5`;
		const submissions = await tx<{ id: string; student: string; lesson: string; created_at: Date }[]>`
			select s.id, u.name as student, l.title as lesson, s.created_at
			from submissions s join users u on u.id = s.user_id join lessons l on l.id = s.lesson_id
			where s.reviewed_at is null order by s.created_at limit 5`;
		return { totals, payments, submissions };
	});
}
