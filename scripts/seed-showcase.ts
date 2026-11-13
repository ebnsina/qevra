// Gives ONE student account a full, believable history, for showing the platform to someone:
// a finished course with its certificate and review, a course in progress with quiz results,
// assignments (one marked, one waiting), questions (one answered, one waiting) and a private note,
// plus a payment still waiting for confirmation and one that was turned down.
// The same account then also shows up, by name, in the admin screens that wait on staff.
//
//   node --env-file=.env scripts/seed-showcase.ts student@example.com
//
// The account must exist already. Whatever activity it had is replaced, so never point this at a real student.
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import { tablePdf } from './pdf.ts';
import { upload } from './storage.ts';

const email = process.argv[2];
if (!email?.includes('@')) {
	console.error('Usage: node --env-file=.env scripts/seed-showcase.ts <student email>');
	process.exit(1);
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const sql = postgres(url, { max: 1, onnotice: () => {} });

const DAY = 86_400_000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000);

interface Lesson { id: string; title: string; assignment: string; questions: number }
async function course(where: postgres.Fragment, skip = 0) {
	const [found] = await sql<{ id: string; title: string; price: number }[]>`
		select c.id, c.title, c.price from courses c
		where c.published and c.enrollment_open and ${where} and exists (select 1 from lessons l where l.course_id = c.id)
		order by c.position offset ${skip} limit 1`;
	if (!found) return null;
	const lessons = await sql<Lesson[]>`
		select l.id, l.title, l.assignment, (select count(*)::int from quiz_questions q where q.lesson_id = l.id) as questions
		from lessons l join modules m on m.id = l.module_id where l.course_id = ${found.id}
		order by m.position, l.position, l.title`;
	return { ...found, lessons };
}

const [student] = await sql<{ id: string; name: string; phone: string; role: string }[]>`
	select id, name, phone, role from users where email = ${email}`;
if (!student) throw new Error(`no account with the email ${email}: create it first`);
if (student.role !== 'student') throw new Error(`${email} is a staff account; give a student's email`);
const [staff] = await sql<{ id: string; name: string }[]>`select id, name from users where role = 'admin' order by created_at limit 1`;
if (!staff) throw new Error('no staff account yet: create one with scripts/create-admin.ts');

const free = await course(sql`c.price = 0`);
const current = await course(sql`c.price > 0`);
const waiting = await course(sql`c.price > 0`, 1);
if (!free || !current || !waiting) throw new Error('needs one free and two paid courses with lessons: run the seed with --sample first');
const [coupon] = await sql<{ id: string; percent_off: number }[]>`select id, percent_off from coupons where code = 'WELCOME10'`;

// The student's own copy of a handed-in file: the app only lets the owner and staff open it.
const workKey = `submissions/${student.id}/assignment.pdf`;
await upload(
	workKey,
	tablePdf({
		title: 'Assignment',
		note: `Handed in by ${student.name} (demo data).`,
		footer: 'Demo',
		headers: ['Sentence'],
		rows: [['This is my first week at the new office.'], ['Those files on the desk are for the manager.'], ['Each of us has a different task today.']]
	})
);

const phone = student.phone || '01700-000000';
const fee = coupon ? Math.round((current.price * (100 - coupon.percent_off)) / 100) : current.price;
const half = current.lessons.slice(0, Math.ceil(current.lessons.length * 0.6));
// The assignment to hand in may sit later in the course than the student has reached.
const task = current.lessons.find((l) => l.assignment);

await sql.begin(async (tx) => {
	for (const table of ['lesson_notes', 'lesson_posts', 'course_reviews', 'certificates', 'submissions', 'quiz_attempts', 'lesson_progress', 'payments', 'enrollments']) {
		await tx`delete from ${tx(table)} where user_id = ${student.id}`;
	}

	// 1. A free course, finished six weeks ago: certificate and a published review.
	await tx`insert into enrollments (user_id, course_id, created_at, completed_at) values (${student.id}, ${free.id}, ${ago(40)}, ${ago(34)})`;
	for (const [i, lesson] of free.lessons.entries()) {
		const at = ago(39 - i * 1.5);
		await tx`insert into lesson_progress (user_id, lesson_id, completed_at) values (${student.id}, ${lesson.id}, ${at})`;
		if (lesson.questions) {
			await tx`insert into quiz_attempts (user_id, lesson_id, score, total, passed, created_at)
				values (${student.id}, ${lesson.id}, ${lesson.questions}, ${lesson.questions}, true, ${at})`;
		}
		// Its assignment was handed in and marked by the teacher.
		if (lesson.assignment) {
			await tx`insert into submissions (user_id, lesson_id, file_key, file_name, note, grade, feedback, created_at, reviewed_at)
				values (${student.id}, ${lesson.id}, ${workKey}, 'assignment.pdf', 'Please check my use of articles.', '8/10',
					'Well done. Watch the article in sentence two: "the manager", not "a manager".', ${at}, ${new Date(at.getTime() + 20 * 3_600_000)})`;
		}
	}
	await tx`insert into certificates (code, user_id, course_id, issued_at)
		values (${`LS${randomBytes(4).toString('hex').toUpperCase()}`}, ${student.id}, ${free.id}, ${ago(34)})`;
	await tx`insert into course_reviews (user_id, course_id, rating, body, author_name, approved, created_at)
		values (${student.id}, ${free.id}, 5, 'A gentle start. Short lessons, and the quiz after each one showed me what I had really understood.',
			${student.name}, true, ${ago(33)})`;

	// 2. A paid course in progress: a payment that was turned down, then one confirmed (with the coupon).
	await tx`insert into payments (user_id, course_id, method, sender_number, transaction_id, amount, status, note, created_at, reviewed_at)
		values (${student.id}, ${current.id}, 'bkash', ${phone}, 'DEMO7Q2K9A', ${current.price}, 'rejected',
			'We could not find this transaction. Please check the ID and send it again.', ${ago(22)}, ${ago(21, 20)})`;
	await tx`insert into payments (user_id, course_id, method, sender_number, transaction_id, amount, coupon_id, status, created_at, reviewed_at)
		values (${student.id}, ${current.id}, 'bkash', ${phone}, 'DEMO7Q2K9B', ${fee}, ${coupon?.id ?? null}, 'approved', ${ago(21, 12)}, ${ago(21)})`;
	await tx`insert into enrollments (user_id, course_id, created_at) values (${student.id}, ${current.id}, ${ago(21)})`;
	for (const [i, lesson] of half.entries()) {
		const at = ago(20 - i * 3);
		await tx`insert into lesson_progress (user_id, lesson_id, completed_at) values (${student.id}, ${lesson.id}, ${at})`;
		if (lesson.questions) {
			// The first quiz took two tries.
			if (i < 2) {
				await tx`insert into quiz_attempts (user_id, lesson_id, score, total, passed, created_at)
					values (${student.id}, ${lesson.id}, ${Math.max(lesson.questions - 2, 0)}, ${lesson.questions}, false, ${new Date(at.getTime() - 1_800_000)})`;
			}
			await tx`insert into quiz_attempts (user_id, lesson_id, score, total, passed, created_at)
				values (${student.id}, ${lesson.id}, ${lesson.questions}, ${lesson.questions}, true, ${at})`;
		}
	}
	// An assignment handed in this morning, still waiting for the teacher.
	if (task) {
		await tx`insert into submissions (user_id, lesson_id, file_key, file_name, created_at)
			values (${student.id}, ${task.id}, ${workKey}, 'assignment.pdf', ${ago(0, 5)})`;
	}
	// Questions under lessons: one the teacher answered, one sent today.
	const [question] = await tx<{ id: string }[]>`
		insert into lesson_posts (lesson_id, user_id, author_name, body, created_at)
		values (${half[0].id}, ${student.id}, ${student.name}, 'Is "an" used before every word that starts with a vowel letter, or only a vowel sound?', ${ago(18)})
		returning id`;
	await tx`insert into lesson_posts (lesson_id, user_id, parent_id, author_name, by_staff, body, created_at)
		values (${half[0].id}, ${staff.id}, ${question.id}, ${staff.name}, true,
			'Only the sound matters: "an hour" (silent h) but "a university" (it starts with a "y" sound). Good question.', ${ago(17, 14)})`;
	await tx`insert into lesson_posts (lesson_id, user_id, author_name, body, created_at)
		values (${half[half.length - 1].id}, ${student.id}, ${student.name}, 'Can you give two more examples like the last one in the video?', ${ago(0, 3)})`;
	await tx`insert into lesson_notes (user_id, lesson_id, body, updated_at)
		values (${student.id}, ${half[0].id}, 'a / an = one of many. the = the one we both know. Revise before Friday''s live class.', ${ago(18)})`;
	// A review of this course, sent yesterday and not published yet.
	await tx`insert into course_reviews (user_id, course_id, rating, body, author_name, approved, created_at)
		values (${student.id}, ${current.id}, 4, 'Clear explanations and quick answers to my questions. I would like more practice sheets.',
			${student.name}, false, ${ago(1)})`;

	// 3. A second paid course: payment sent a few hours ago, still waiting for staff.
	await tx`insert into payments (user_id, course_id, method, sender_number, transaction_id, amount, status, created_at)
		values (${student.id}, ${waiting.id}, 'nagad', ${phone}, 'DEMO4M8X1C', ${waiting.price}, 'pending', ${ago(0, 4)})`;
});
await sql.end();

console.log(`${student.name} (${email}) now has:`);
console.log(`- "${free.title}": finished, with a marked assignment, a certificate and a published review`);
console.log(`- "${current.title}": ${half.length} of ${current.lessons.length} lessons done, quiz results, an assignment waiting to be marked, 2 questions, a private note, a review waiting to be published`);
console.log(`- "${waiting.title}": a payment waiting for confirmation`);
console.log('In the admin area, look under Payments, Questions, Submissions and Course reviews for the items waiting on staff.');
