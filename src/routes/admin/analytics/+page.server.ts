// How the academy is doing over a chosen period: trends, money, ratings, quizzes and each course.
// Numbers only: nothing here is changed.
const PERIODS = [30, 90, 365];

export async function load({ locals, url }) {
	const asked = Number(url.searchParams.get('days'));
	const days = PERIODS.includes(asked) ? asked : 30;
	return locals.db(async (tx) => {
		const since = tx`current_date - ${days - 1}::int`;
		const series = await tx<{ day: Date; enrollments: number; income: number; signups: number; lessons: number; quizzes: number }[]>`
			select d::date as day,
				(select count(*)::int from enrollments e where e.created_at::date = d::date) as enrollments,
				(select coalesce(sum(p.amount), 0)::int from payments p where p.status = 'approved' and p.reviewed_at::date = d::date) as income,
				(select count(*)::int from users u where u.role = 'student' and u.created_at::date = d::date) as signups,
				(select count(*)::int from lesson_progress lp where lp.completed_at::date = d::date) as lessons,
				(select count(*)::int from quiz_attempts a where a.created_at::date = d::date) as quizzes
			from generate_series(${since}, current_date, interval '1 day') d
			order by d`;
		const [totals] = await tx<{ active: number; enrollments: number; completed: number; rating: number | null; reviews: number; tries: number; passes: number; coupons: number }[]>`
			select
				(select count(distinct user_id)::int from lesson_progress where completed_at::date >= ${since}) as active,
				(select count(*)::int from enrollments) as enrollments,
				(select count(*)::int from enrollments where completed_at is not null) as completed,
				(select round(avg(rating), 1)::float from course_reviews where approved) as rating,
				(select count(*)::int from course_reviews where approved) as reviews,
				(select count(*)::int from quiz_attempts where created_at::date >= ${since}) as tries,
				(select count(*)::int from quiz_attempts where created_at::date >= ${since} and passed) as passes,
				(select count(*)::int from payments where coupon_id is not null and status = 'approved' and reviewed_at::date >= ${since}) as coupons`;

		const income = await tx<{ id: string; title: string; income: number; payments: number }[]>`
			select c.id, c.title, coalesce(sum(p.amount), 0)::int as income, count(p.id)::int as payments
			from courses c
			join payments p on p.course_id = c.id and p.status = 'approved' and p.reviewed_at::date >= ${since}
			group by c.id, c.title order by income desc limit 6`;
		const methods = await tx<{ method: string; payments: number; income: number }[]>`
			select method, count(*)::int as payments, coalesce(sum(amount), 0)::int as income
			from payments where status = 'approved' and reviewed_at::date >= ${since}
			group by method order by payments desc`;
		const statuses = await tx<{ status: string; payments: number }[]>`
			select status, count(*)::int as payments from payments where created_at::date >= ${since} group by status`;
		const ratings = await tx<{ rating: number; reviews: number }[]>`
			select g as rating, (select count(*)::int from course_reviews r where r.approved and r.rating = g) as reviews
			from generate_series(5, 1, -1) g`;
		// The quizzes students fail most, among those with enough tries to mean something.
		const quizzes = await tx<{ id: string; lesson: string; course: string; tries: number; passes: number }[]>`
			select l.id, l.title as lesson, c.title as course, count(*)::int as tries, count(*) filter (where a.passed)::int as passes
			from quiz_attempts a join lessons l on l.id = a.lesson_id join courses c on c.id = l.course_id
			group by l.id, l.title, c.title having count(*) >= 5
			order by count(*) filter (where a.passed)::float / count(*) limit 5`;
		const students = await tx<{ id: string; name: string; lessons: number }[]>`
			select u.id, u.name, count(*)::int as lessons
			from lesson_progress p join users u on u.id = p.user_id
			where p.completed_at::date >= ${since}
			group by u.id, u.name order by lessons desc, u.name limit 6`;

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
			from courses c order by students desc, c.position`;
		// For each lesson, how many of the course's students have finished it: where the line drops is where they stop.
		const lessons = await tx<{ id: string; course_id: string; title: string; done: number }[]>`
			select l.id, l.course_id, l.title,
				(select count(*)::int from lesson_progress p where p.lesson_id = l.id) as done
			from lessons l join modules m on m.id = l.module_id
			order by m.position, l.position, l.title`;
		return { days, series, totals, income, methods, statuses, ratings, quizzes, students, courses, lessons };
	});
}
