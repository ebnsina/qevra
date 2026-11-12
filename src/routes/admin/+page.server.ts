// The admin's first screen: totals, the last 30 days, what is waiting for staff, and what happened lately.
const DAYS = 30;

export async function load({ locals }) {
	return locals.db(async (tx) => {
		const [totals] = await tx<{ students: number; enrollments: number; completed: number; income: number; courses: number }[]>`
			select
				(select count(*)::int from users where role = 'student') as students,
				(select count(*)::int from enrollments) as enrollments,
				(select count(*)::int from enrollments where completed_at is not null) as completed,
				(select coalesce(sum(amount), 0)::int from payments where status = 'approved') as income,
				(select count(*)::int from courses where published) as courses`;
		const days = await tx<{ day: Date; enrollments: number; income: number; signups: number; lessons: number }[]>`
			select d::date as day,
				(select count(*)::int from enrollments e where e.created_at::date = d::date) as enrollments,
				(select coalesce(sum(p.amount), 0)::int from payments p where p.status = 'approved' and p.reviewed_at::date = d::date) as income,
				(select count(*)::int from users u where u.role = 'student' and u.created_at::date = d::date) as signups,
				(select count(*)::int from lesson_progress lp where lp.completed_at::date = d::date) as lessons
			from generate_series(current_date - ${DAYS - 1}::int, current_date, interval '1 day') d
			order by d`;

		const payments = await tx<{ id: string; student: string; course: string; amount: number; created_at: Date }[]>`
			select p.id, u.name as student, c.title as course, p.amount, p.created_at
			from payments p join users u on u.id = p.user_id join courses c on c.id = p.course_id
			where p.status = 'pending' order by p.created_at limit 5`;
		const questions = await tx<{ id: string; student: string; lesson: string; body: string; created_at: Date }[]>`
			select q.id, q.author_name as student, l.title as lesson, q.body, q.created_at
			from lesson_posts q join lessons l on l.id = q.lesson_id
			where q.parent_id is null and not exists (select 1 from lesson_posts r where r.parent_id = q.id and r.by_staff)
			order by q.created_at limit 5`;
		const submissions = await tx<{ id: string; student: string; lesson: string; created_at: Date }[]>`
			select s.id, u.name as student, l.title as lesson, s.created_at
			from submissions s join users u on u.id = s.user_id join lessons l on l.id = s.lesson_id
			where s.reviewed_at is null order by s.created_at limit 5`;

		const recent = await tx<{ id: string; student: string; course: string; created_at: Date }[]>`
			select e.id, u.name as student, c.title as course, e.created_at
			from enrollments e join users u on u.id = e.user_id join courses c on c.id = e.course_id
			order by e.created_at desc limit 6`;
		const courses = await tx<{ id: string; title: string; students: number; completed: number }[]>`
			select c.id, c.title,
				(select count(*)::int from enrollments e where e.course_id = c.id) as students,
				(select count(*)::int from enrollments e where e.course_id = c.id and e.completed_at is not null) as completed
			from courses c where c.published order by students desc, c.position limit 5`;
		return { totals, days, payments, questions, submissions, recent, courses };
	});
}
