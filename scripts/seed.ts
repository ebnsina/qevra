// Fills a new setup with the academy's real content (scripts/content). Safe to run twice.
//
//   node --env-file=.env scripts/seed.ts            the website's content only
//   node --env-file=.env scripts/seed.ts --sample   also sample teaching material, to show a customer:
//                                                   lessons built on the academy's public YouTube videos,
//                                                   quizzes, assignments, live classes and study sheets
//   node --env-file=.env scripts/seed.ts --demo     --sample plus demo accounts and a free practice
//                                                   course, for local work and tests. Never on
//                                                   production: the demo passwords are public.
import { readFile, readdir } from 'node:fs/promises';
import { AwsClient } from 'aws4fetch';
import postgres from 'postgres';
import { hashPassword } from '../src/lib/server/password.ts';
import { resources } from './content/resources.ts';
import { tablePdf } from './pdf.ts';

interface Course {
	slug: string;
	title: string;
	level: string;
	price: number;
	regular_price?: number;
	summary: string;
	description: string;
	outcomes: string;
	requirements: string;
}
interface Content {
	settings: Record<string, string>;
	home: Record<string, string>;
	courses: Course[];
	reviews: [name: string, affiliation: string, body: string][];
	posts: { slug: string; title: string; excerpt: string; body: string; image: string | null; published_at: string }[];
	pages: { slug: string; title: string; body: string }[];
}

interface Lesson {
	title: string;
	video: string;
	body: string;
	preview?: boolean;
	assignment?: string;
	quiz?: [question: string, options: string[], correct: number][];
	/** A study sheet (by its title in resources.ts) attached to the lesson as a download. */
	download?: { sheet: string; title: string };
}
type Curriculum = Record<
	string,
	{
		live: { title: string; in_days: number; hour: number; minute: number }[];
		announcement?: { title: string; body: string };
		sections: { title: string; lessons: Lesson[] }[];
	}
>;

const demo = process.argv.includes('--demo');
const sample = demo || process.argv.includes('--sample');
const env = (name: string) => {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
};

const dir = new URL('./content/', import.meta.url);
const content: Content = JSON.parse(await readFile(new URL('delta.json', dir), 'utf8'));
const curriculum: Curriculum = JSON.parse(await readFile(new URL('curriculum.json', dir), 'utf8'));
const partnerFiles = (await readdir(new URL('partners/', dir))).sort();
const sql = postgres(env('DATABASE_URL'), { max: 1, onnotice: () => {} });

// Where each file lives in storage. The database rows below point at the same keys.
const LOGO = 'public/site/logo.png';
const courseImage = (slug: string) => `public/courses/${slug}.jpg`;
const partnerImage = (file: string) => `public/partners/${file}`;
const postImage = (slug: string) => `public/posts/${slug}.jpg`;

const storage = new AwsClient({
	accessKeyId: env('AWS_ACCESS_KEY_ID'),
	secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
	region: env('AWS_REGION'),
	service: 's3'
});
const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf' };

async function upload(key: string, body: string | Uint8Array<ArrayBuffer>) {
	const res = await storage.fetch(`${env('AWS_ENDPOINT_URL_S3')}/files/${key}`, {
		method: 'PUT',
		body,
		headers: { 'content-type': TYPES[key.split('.').pop()!] }
	});
	if (!res.ok) throw new Error(`uploading ${key} failed with ${res.status}`);
}

/** Puts every file in storage. Run each time, so a new or emptied bucket is filled again. */
async function uploadFiles() {
	const file = async (path: string, key: string) => upload(key, await readFile(new URL(path, dir)));
	await file('logo.png', LOGO);
	for (const name of partnerFiles) await file(`partners/${name}`, partnerImage(name));
	for (const course of content.courses) await file(`courses/${course.slug}.jpg`, courseImage(course.slug));
	for (const post of content.posts) if (post.image) await file(post.image, postImage(post.slug));
	if (sample) {
		const footer = `${content.settings.name} - ${content.settings.tagline}`;
		for (const sheet of resources) await upload(sheet.key, tablePdf({ ...sheet, footer }));
	}
}

async function seedContent() {
	await sql.begin(async (tx) => {
		if ((await tx`select 1 from courses limit 1`).length) return console.log('content is already there');

		await tx`insert into site_content (key, value) values
			('settings', ${tx.json({ ...content.settings, logo_key: LOGO })}), ('home', ${tx.json(content.home)})
			on conflict (key) do nothing`;

		for (const [i, name] of partnerFiles.entries()) {
			const label = name.replace(/^\d+-|\.png$/g, '').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
			await tx`insert into partners (name, image_key, position) values (${label}, ${partnerImage(name)}, ${i})`;
		}
		// Courses start closed: openCoursesWithLessons() below opens the ones that have something to teach.
		for (const [i, course] of content.courses.entries()) {
			await tx`
				insert into courses (slug, title, level, price, regular_price, summary, description, outcomes, requirements,
					image_key, published, enrollment_open, position)
				values (${course.slug}, ${course.title}, ${course.level}, ${course.price}, ${course.regular_price ?? null}, ${course.summary},
					${course.description}, ${course.outcomes}, ${course.requirements}, ${courseImage(course.slug)}, true, false, ${i})`;
		}
		for (const [i, [name, affiliation, body]] of content.reviews.entries()) {
			await tx`insert into reviews (name, affiliation, body, position) values (${name}, ${affiliation}, ${body}, ${i})`;
		}
		for (const post of content.posts) {
			await tx`insert into posts (slug, title, excerpt, body, image_key, published_at)
				values (${post.slug}, ${post.title}, ${post.excerpt}, ${post.body},
					${post.image ? postImage(post.slug) : null}, ${post.published_at})`;
		}
		for (const page of content.pages) {
			await tx`insert into pages (slug, title, body) values (${page.slug}, ${page.title}, ${page.body})`;
		}
		console.log('content added');
	});
}

// --- Sample teaching material (--sample) ---

/** A moment `inDays` from today at the given time in Bangladesh. */
function dhakaTime(inDays: number, hour: number, minute: number) {
	const day = new Date(Date.now() + 6 * 3_600_000 + inDays * 86_400_000).toISOString().slice(0, 10);
	const two = (n: number) => String(n).padStart(2, '0');
	return new Date(`${day}T${two(hour)}:${two(minute)}:00+06:00`);
}

/** Adds a course's sections, lessons and quizzes, unless it already has some. */
async function addLessons(tx: postgres.TransactionSql, slug: string, sections: Curriculum[string]['sections']) {
	const [course] = await tx<{ id: string }[]>`
		select c.id from courses c
		where c.slug = ${slug} and not exists (select 1 from modules m where m.course_id = c.id)`;
	if (!course) return null;
	let position = 0;
	for (const [m, section] of sections.entries()) {
		const [{ id: moduleId }] = await tx`
			insert into modules (course_id, title, position) values (${course.id}, ${section.title}, ${m}) returning id`;
		for (const lesson of section.lessons) {
			const [{ id: lessonId }] = await tx`
				insert into lessons (course_id, module_id, title, position, video_url, body, assignment, is_preview)
				values (${course.id}, ${moduleId}, ${lesson.title}, ${position++}, ${lesson.video}, ${lesson.body},
					${lesson.assignment ?? ''}, ${lesson.preview ?? false})
				returning id`;
			for (const [q, [question, options, correct]] of (lesson.quiz ?? []).entries()) {
				await tx`insert into quiz_questions (lesson_id, question, options, correct, position)
					values (${lessonId}, ${question}, ${options}, ${correct}, ${q})`;
			}
		}
	}
	console.log(`lessons added to ${slug}`);
	return course.id;
}

async function seedSample() {
	await sql.begin(async (tx) => {
		for (const [slug, course] of Object.entries(curriculum)) {
			const courseId = await addLessons(tx, slug, course.sections);
			if (!courseId) continue;
			// The meeting link is a stand-in: put the real Zoom or Meet link on each class in the admin area.
			for (const live of course.live) {
				await tx`insert into live_classes (course_id, title, starts_at, meeting_url)
					values (${courseId}, ${live.title}, ${dhakaTime(live.in_days, live.hour, live.minute)}, 'https://zoom.us/')`;
			}
		}
		// Each of these is added once, also to a setup that was seeded before they existed.
		const footer = `${content.settings.name} - ${content.settings.tagline}`;
		for (const [slug, course] of Object.entries(curriculum)) {
			const [{ id: courseId } = { id: null }] = await tx<{ id: string }[]>`select id from courses where slug = ${slug}`;
			if (!courseId) continue;
			if (course.announcement && !(await tx`select 1 from announcements where course_id = ${courseId} limit 1`).length) {
				await tx`insert into announcements (course_id, title, body) values (${courseId}, ${course.announcement.title}, ${course.announcement.body})`;
			}
			for (const lesson of course.sections.flatMap((section) => section.lessons)) {
				const sheet = resources.find((r) => r.title === lesson.download?.sheet);
				if (!lesson.download || !sheet) continue;
				const [row] = await tx<{ id: string }[]>`
					select l.id from lessons l where l.course_id = ${courseId} and l.title = ${lesson.title}
						and not exists (select 1 from lesson_files f where f.lesson_id = l.id)`;
				if (!row) continue;
				// Under the course's id: that is how the app knows only its students may download it.
				const key = `lessons/${courseId}/${sheet.key.split('/').pop()}`;
				await upload(key, tablePdf({ ...sheet, footer }));
				await tx`insert into lesson_files (lesson_id, title, file_key, file_name)
					values (${row.id}, ${lesson.download.title}, ${key}, ${`${sheet.title}.pdf`})`;
			}
		}
		for (const course of content.courses) {
			if (course.regular_price) await tx`update courses set regular_price = ${course.regular_price} where slug = ${course.slug} and regular_price is null`;
		}
		await tx`insert into coupons (code, percent_off) values ('WELCOME10', 10) on conflict (code) do nothing`;

		if (!(await tx`select 1 from resources limit 1`).length) {
			for (const [i, sheet] of resources.entries()) {
				await tx`insert into resources (title, description, file_key, file_name, position)
					values (${sheet.title}, ${sheet.description}, ${sheet.key}, ${`${sheet.title}.pdf`}, ${i})`;
			}
			console.log('study sheets added');
		}
	});
}

// --- Demo accounts and a free practice course (--demo) ---

const PRACTICE_COURSE = 'english-for-complete-idiots';
const practiceLessons: Curriculum[string]['sections'] = [
	{
		title: 'Getting started',
		lessons: [
			{ title: 'How this course works', video: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', preview: true, body: 'Welcome. Watch each lesson, then mark it complete to move on.' },
			{ title: 'Introducing yourself', video: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', body: 'Practise saying your name, where you are from and what you do.' }
		]
	},
	{
		title: 'Everyday English',
		lessons: [
			{
				title: 'Asking questions',
				video: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
				body: 'Questions with *do*, *does*, *is* and *are*.',
				quiz: [
					['Which question is correct?', ['Where you live?', 'Where do you live?', 'Where does you live?'], 1],
					['Choose the right word: "___ she a teacher?"', ['Do', 'Is', 'Are'], 1],
					['Choose the right word: "___ they work here?"', ['Do', 'Does', 'Is'], 0]
				]
			},
			{
				title: 'Write about your day',
				video: '',
				body: 'Use what you have learned so far.',
				assignment: 'Write 8 to 10 sentences about what you did yesterday. Upload it as a PDF, Word file or a clear photo.'
			}
		]
	}
];

async function seedDemo() {
	await sql.begin(async (tx) => {
		const users = [
			['admin@example.com', 'Academy Admin', 'admin', 'admin12345'],
			['student@example.com', 'Sample Student', 'student', 'student12345']
		];
		for (const [email, name, role, password] of users) {
			await tx`insert into users (email, name, role, password_hash)
				values (${email}, ${name}, ${role}, ${await hashPassword(password)}) on conflict (email) do nothing`;
		}
		// A free course with lessons, so joining without payment can be tried.
		await addLessons(tx, PRACTICE_COURSE, practiceLessons);
	});
	console.log('Demo sign-ins: admin@example.com / admin12345 and student@example.com / student12345');
}

/** A course is open for enrollment once it has lessons: nobody should pay for an empty course. */
async function openCoursesWithLessons() {
	const opened = await sql`
		update courses c set enrollment_open = true
		where not c.enrollment_open and exists (select 1 from lessons l where l.course_id = c.id)
		returning c.title`;
	if (opened.length) console.log(`open for enrollment: ${opened.map((c) => c.title).join(', ')}`);
}

await uploadFiles();
await seedContent();
if (sample) await seedSample();
if (demo) await seedDemo();
if (sample) await openCoursesWithLessons();
else console.log('No courses are open for enrollment yet: add lessons in the admin area, then switch each course on.');
await sql.end();
