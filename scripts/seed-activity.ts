// Fills a setup with a large amount of made-up activity, so dashboards, charts and course pages look
// lived-in when showing the platform: students, enrollments, payments, progress, quiz results,
// questions and answers, reviews and assignments, spread over the last four months.
//
//   node --env-file=.env scripts/seed-activity.ts           add it (once; run --clear first to redo)
//   node --env-file=.env scripts/seed-activity.ts --clear   remove every bit of it
//
// Everything hangs off students whose email ends in @demo.tadris.test, so removing those accounts
// removes all of it. None of these people are real: clear it before the academy takes real students.
import { randomBytes } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import postgres from 'postgres';
import { hashPassword } from '../src/lib/server/password.ts';
import { tablePdf } from './pdf.ts';

const DOMAIN = 'demo.tadris.test';
const STUDENTS = 640;
const DAYS = 120;

const env = (name: string) => {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
};
const sql = postgres(process.env.DATABASE_URL_UNPOOLED || env('DATABASE_URL'), { max: 1, onnotice: () => {} });

if (process.argv.includes('--clear')) {
	const gone = await sql`delete from users where email like ${`%@${DOMAIN}`} returning id`;
	console.log(`removed ${gone.length} demo students and everything attached to them`);
	await sql.end();
	process.exit(0);
}
if ((await sql`select 1 from users where email like ${`%@${DOMAIN}`} limit 1`).length) {
	console.log('demo activity is already there; run with --clear first to redo it');
	await sql.end();
	process.exit(0);
}

// The same "random" data every run, so two setups look alike.
let state = 20261112;
const random = () => {
	state = (state * 1664525 + 1013904223) % 4294967296;
	return state / 4294967296;
};
const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
const chance = (p: number) => random() < p;
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const uuid = () => {
	const b = Array.from({ length: 16 }, () => Math.floor(random() * 256));
	b[6] = (b[6] & 0x0f) | 0x40;
	b[8] = (b[8] & 0x3f) | 0x80;
	const h = b.map((x) => x.toString(16).padStart(2, '0')).join('');
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const now = Date.now();
const DAY = 86_400_000;
/** A moment between two others, never in the future. */
// A random time between the two, never in the future (and not piled up on today either).
const moment = (from: number, to: number) => {
	const start = Math.min(from, now - 120_000);
	return new Date(start + random() * Math.max(Math.min(to, now - 60_000) - start, 1));
};

const FIRST = ['Asif', 'Ayesha', 'Mahmud', 'Sadia', 'Abdullah', 'Nusrat', 'Tanvir', 'Farhana', 'Rakib', 'Sumaiya', 'Imran', 'Tasnim', 'Shakil', 'Mim', 'Rafiq', 'Jannat', 'Hasan', 'Lamia', 'Sabbir', 'Nadia', 'Arif', 'Sharmin', 'Fahim', 'Rumana', 'Mehedi', 'Sabrina', 'Nayeem', 'Tania', 'Zahid', 'Maliha', 'Shuvo', 'Ishrat', 'Rifat', 'Afsana', 'Kamrul', 'Fatema', 'Sajid', 'Mariam', 'Tareq', 'Samia', 'Jubayer', 'Anika', 'Monir', 'Sultana', 'Rasel', 'Habiba', 'Shahin', 'Purnima', 'Emon', 'Rokeya'];
const LAST = ['Rahman', 'Islam', 'Hossain', 'Ahmed', 'Khan', 'Akter', 'Chowdhury', 'Uddin', 'Sarker', 'Mia', 'Begum', 'Hasan', 'Karim', 'Sultana', 'Ali', 'Khatun', 'Talukder', 'Mahmud', 'Siddique', 'Haque', 'Biswas', 'Roy', 'Das', 'Molla', 'Sheikh'];
const QUESTIONS = [
	'Could you give two more examples of this? I understood the rule but not when to use it.',
	'Is this also correct in spoken English, or only in writing?',
	'I got question 2 of the quiz wrong. Why is the second option not correct?',
	'Does this rule appear in the BCS Preliminary test often?',
	'What is the difference between this and what we learned in the previous lesson?',
	'Can I use this structure in formal emails?',
	'Sir, the video stopped at 12 minutes for me. Is it the same for others?',
	'How should I practise this at home? Is there any worksheet?',
	'I always confuse these two. Is there an easy way to remember?',
	'Can you explain the last example again? I could not follow the Bangla translation.',
	'Will there be a live class on this topic?',
	'Is the PDF for this lesson the same as the one in the Resources page?'
];
const ANSWERS = [
	'Good question. Yes: think of it as one unit, and test it by replacing the whole phrase with "it" or "they". If the sentence still works, you found the phrase. I will add two more examples in the next live class.',
	'Both are used in speech, but in exams always choose the formal one. Watch the last five minutes again, where I compare them side by side.',
	'Look at the verb after the blank: it is singular, so the subject must be singular too. That rules out the second option.',
	'Yes, almost every year. Do the practice set after this section and note the pattern of the wrong options.',
	'Use the sheet attached to this lesson, and write five sentences of your own every day. Post them here and I will check.',
	'It is in the recording of the last live class, from minute 18. Tell me if it is still unclear after that.'
];
const REVIEWS = [
	[5, 'For the first time grammar feels like something I can use, not something to memorise.'],
	[5, 'The explanations in Bangla with English examples are exactly what I needed. Highly recommended.'],
	[5, 'Sir answers every question. The quizzes after each lesson showed me what I had missed.'],
	[5, 'I failed the Preliminary twice because of English. After this course my mock scores went up a lot.'],
	[4, 'Very clear lessons. I would like more practice sets for each topic.'],
	[5, 'Short lessons, easy to follow on the phone during my commute.'],
	[4, 'Good course and good value. Some videos are a little long.'],
	[5, 'The lesson on determiners finally cleared up a/an and the for me.'],
	[5, 'I liked that I could ask under each lesson and get an answer the next day.'],
	[4, 'Helpful and well organised. The live classes are the best part.'],
	[3, 'Useful content, but I wanted more speaking practice.'],
	[5, 'Worth every taka. My writing has improved and I feel more confident.'],
	[5, 'The feedback on my assignment was specific and kind. Thank you, sir.'],
	[4, 'Clear and practical. The certificate at the end was a nice motivation.']
] as const;
const FEEDBACK = ['Well done. Watch your articles in sentences 3 and 6.', 'Good effort. Your verbs are right; work on sentence length.', 'Very good. Only two small mistakes with determiners.', 'Nice work. Try to use more linking words next time.'];
const GRADES = ['8/10', '9/10', '7/10', 'Good', 'Very good', '6/10'];

type Row = Record<string, string | number | boolean | Date | null>;
async function insert(tx: postgres.TransactionSql, table: string, rows: Row[]) {
	for (let i = 0; i < rows.length; i += 500) await tx`insert into ${tx(table)} ${tx(rows.slice(i, i + 500))}`;
}

const courses = await sql<{ id: string; slug: string; title: string; price: number }[]>`
	select c.id, c.slug, c.title, c.price from courses c
	where c.published and c.enrollment_open and c.price > 0 and exists (select 1 from lessons l where l.course_id = c.id)
	order by c.position`;
if (!courses.length) {
	console.log('No open paid course has lessons yet. Run the seed with --sample first.');
	await sql.end();
	process.exit(1);
}
const lessons = await sql<{ id: string; course_id: string; assignment: string; has_quiz: boolean; questions: number }[]>`
	select l.id, l.course_id, l.assignment,
		exists (select 1 from quiz_questions q where q.lesson_id = l.id) as has_quiz,
		(select count(*)::int from quiz_questions q where q.lesson_id = l.id) as questions
	from lessons l join modules m on m.id = l.module_id order by m.position, l.position, l.title`;
const [admin] = await sql<{ id: string; name: string }[]>`select id, name from users where role = 'admin' order by created_at limit 1`;
const [coupon] = await sql<{ id: string; percent_off: number }[]>`select id, percent_off from coupons where code = 'WELCOME10'`;

// One stand-in file for every handed-in assignment; staff can open it.
const WORK_KEY = 'submissions/demo/assignment.pdf';
const storage = new AwsClient({ accessKeyId: env('AWS_ACCESS_KEY_ID'), secretAccessKey: env('AWS_SECRET_ACCESS_KEY'), region: env('AWS_REGION'), service: 's3' });
const put = await storage.fetch(`${env('AWS_ENDPOINT_URL_S3')}/files/${WORK_KEY}`, {
	method: 'PUT',
	headers: { 'content-type': 'application/pdf' },
	body: tablePdf({ title: 'Assignment', note: 'A stand-in for a student\'s handed-in work (demo data).', footer: 'Demo', headers: ['Sentence'], rows: [['Yesterday I went to the library with my friend.'], ['We read a book about the history of Dhaka.'], ['After that we had some tea and talked about our exams.']] })
});
if (!put.ok) throw new Error(`uploading the demo assignment failed with ${put.status}`);

// Nobody can sign in as a demo student: the password is random and thrown away.
const passwordHash = await hashPassword(randomBytes(24).toString('base64url'));

const users: Row[] = [];
const enrollments: Row[] = [];
const payments: Row[] = [];
const progress: Row[] = [];
const attempts: Row[] = [];
const submissions: Row[] = [];
const certificates: Row[] = [];
const posts: Row[] = [];
const reviews: Row[] = [];

for (let i = 0; i < STUDENTS; i++) {
	const [first, last] = [pick(FIRST), pick(LAST)];
	const name = `${first} ${last}`;
	// More sign-ups lately than four months ago: squaring pulls the dates toward today.
	const joined = now - (1 - Math.sqrt(random())) * DAYS * DAY;
	const user = { id: uuid(), email: `${first}.${last}.${i}@${DOMAIN}`.toLowerCase(), name, phone: `017${between(10000000, 99999999)}`, password_hash: passwordHash, role: 'student', created_at: new Date(joined) };
	users.push(user);

	const taking = courses.filter((c, index) => chance(index === 0 ? 0.5 : 0.7));
	if (!taking.length) taking.push(pick(courses));
	for (const course of taking) {
		const enrolled = moment(joined, joined + 6 * DAY).getTime();
		const discounted = coupon && chance(0.15);
		const amount = discounted ? Math.round((course.price * (100 - coupon.percent_off)) / 100) : course.price;
		const paid = { id: uuid(), user_id: user.id, course_id: course.id, method: chance(0.7) ? 'bkash' : 'nagad', sender_number: user.phone, transaction_id: `DM${i}${course.slug.length}${between(100000, 999999)}`, amount, coupon_id: discounted ? coupon.id : null, note: '', created_at: new Date(enrolled - between(1, 20) * 3_600_000) };

		// A few of the newest payments are still waiting, and a few were turned down: those have no enrollment.
		const recent = now - enrolled < 3 * DAY;
		if (recent && chance(0.35)) {
			payments.push({ ...paid, status: 'pending', reviewed_at: null });
			continue;
		}
		if (chance(0.02)) {
			payments.push({ ...paid, status: 'rejected', reviewed_at: new Date(enrolled), note: 'We could not find this transaction. Please check the ID and send it again.' });
			continue;
		}
		payments.push({ ...paid, status: 'approved', reviewed_at: new Date(enrolled) });

		// How far they got: a fifth finish, most are partway, some never start.
		const mine = lessons.filter((l) => l.course_id === course.id);
		const share = chance(0.2) ? 1 : chance(0.12) ? 0 : random();
		const done = Math.round(mine.length * share);
		let at = enrolled;
		for (const lesson of mine.slice(0, done)) {
			at = moment(at + 3_600_000, at + 4 * DAY).getTime();
			if (lesson.has_quiz) {
				if (chance(0.3)) attempts.push({ id: uuid(), user_id: user.id, lesson_id: lesson.id, score: between(0, Math.max(lesson.questions - 2, 0)), total: lesson.questions, passed: false, created_at: new Date(at - 1_800_000) });
				attempts.push({ id: uuid(), user_id: user.id, lesson_id: lesson.id, score: between(Math.ceil(lesson.questions * 0.6), lesson.questions), total: lesson.questions, passed: true, created_at: new Date(at) });
			}
			if (lesson.assignment) {
				const reviewed = now - at > 2 * DAY || chance(0.5);
				submissions.push({ id: uuid(), user_id: user.id, lesson_id: lesson.id, file_key: WORK_KEY, file_name: 'assignment.pdf', note: chance(0.3) ? 'Please check my use of articles.' : '', grade: reviewed ? pick(GRADES) : '', feedback: reviewed ? pick(FEEDBACK) : '', created_at: new Date(at), reviewed_at: reviewed ? new Date(at + between(4, 40) * 3_600_000) : null });
			}
			progress.push({ user_id: user.id, lesson_id: lesson.id, completed_at: new Date(at) });
			if (chance(0.045)) {
				const question = { id: uuid(), lesson_id: lesson.id, user_id: user.id, parent_id: null, author_name: name, by_staff: false, body: pick(QUESTIONS), created_at: new Date(at) };
				posts.push(question);
				// The newest questions are still waiting for the teacher.
				if (admin && (now - at > 2 * DAY || chance(0.4))) posts.push({ id: uuid(), lesson_id: lesson.id, user_id: admin.id, parent_id: question.id, author_name: admin.name, by_staff: true, body: pick(ANSWERS), created_at: new Date(at + between(2, 30) * 3_600_000) });
			}
		}
		const finished = done === mine.length && mine.length > 0;
		enrollments.push({ id: uuid(), user_id: user.id, course_id: course.id, created_at: new Date(enrolled), completed_at: finished ? new Date(at) : null });
		if (finished) certificates.push({ id: uuid(), code: `DM${i.toString(16).toUpperCase().padStart(4, '0')}${course.slug.length}${between(1000, 9999)}`, user_id: user.id, course_id: course.id, issued_at: new Date(at) });
		if (share > 0.4 && chance(0.45)) {
			const [rating, body] = pick(REVIEWS);
			const sent = moment(at, at + 5 * DAY);
			// The latest few reviews are still waiting for approval.
			reviews.push({ id: uuid(), user_id: user.id, course_id: course.id, rating, body, author_name: name, approved: now - sent.getTime() > 2 * DAY || chance(0.5), created_at: sent });
		}
	}
}

await sql.begin(async (tx) => {
	await insert(tx, 'users', users);
	await insert(tx, 'enrollments', enrollments);
	await insert(tx, 'payments', payments);
	await insert(tx, 'lesson_progress', progress);
	await insert(tx, 'quiz_attempts', attempts);
	await insert(tx, 'submissions', submissions);
	await insert(tx, 'certificates', certificates);
	// Questions first, then the replies that point at them.
	await insert(tx, 'lesson_posts', posts.filter((p) => !p.parent_id));
	await insert(tx, 'lesson_posts', posts.filter((p) => p.parent_id));
	await insert(tx, 'course_reviews', reviews);
});
await sql.end();

const count = (rows: Row[]) => new Intl.NumberFormat('en').format(rows.length);
console.log(
	`added ${count(users)} students, ${count(enrollments)} enrollments, ${count(payments)} payments, ${count(progress)} finished lessons, ` +
		`${count(attempts)} quiz tries, ${count(submissions)} assignments, ${count(certificates)} certificates, ${count(posts)} questions and answers, ${count(reviews)} reviews`
);
console.log('Remove it all with: node --env-file=.env scripts/seed-activity.ts --clear');
