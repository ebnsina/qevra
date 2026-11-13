// Fills a new setup with a sample academy's content (scripts/content). Safe to run twice.
// For a real academy, replace scripts/content/academy.json, or seed and then edit in the admin area.
//
//   node --env-file=.env scripts/seed.ts            the website's content only
//   node --env-file=.env scripts/seed.ts --sample   also sample teaching material: lessons (with
//                                                   license-free placeholder films), quizzes,
//                                                   assignments, live classes and study sheets
//   node --env-file=.env scripts/seed.ts --demo     --sample plus demo accounts, for local work and
//                                                   tests. Never on production: the demo passwords
//                                                   are public.
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { hashPassword } from '../src/lib/server/password.ts';
import { resources } from './content/resources.ts';
import { tablePdf } from './pdf.ts';
import { upload } from './storage.ts';

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
	posts: { slug: string; title: string; excerpt: string; body: string; published_at: string }[];
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
const content: Content = JSON.parse(await readFile(new URL('academy.json', dir), 'utf8'));
const curriculum: Curriculum = JSON.parse(await readFile(new URL('curriculum.json', dir), 'utf8'));
const sql = postgres(env('DATABASE_URL'), { max: 1, onnotice: () => {} });

// Where each file lives in storage. The database rows below point at the same keys.
const courseImage = (slug: string) => `public/courses/${slug}.webp`;
const postImage = (slug: string) => `public/posts/${slug}.webp`;

/** Puts every file in storage. Run each time, so a new or emptied bucket is filled again. */
async function uploadFiles() {
	// One cover photo per course and post (scripts/content/covers, from Unsplash, 800 x 420 WebP).
	const cover = async (slug: string) => new Uint8Array(await readFile(new URL(`covers/${slug}.webp`, dir)));
	for (const course of content.courses) await upload(courseImage(course.slug), await cover(course.slug));
	for (const post of content.posts) await upload(postImage(post.slug), await cover(post.slug));
	if (sample) {
		const footer = `${content.settings.name} - ${content.settings.tagline}`;
		for (const sheet of resources) await upload(sheet.key, tablePdf({ ...sheet, footer }));
	}
}

async function seedContent() {
	await sql.begin(async (tx) => {
		if ((await tx`select 1 from courses limit 1`).length) return console.log('content is already there');

		await tx`insert into site_content (key, value) values
			('settings', ${tx.json(content.settings)}), ('home', ${tx.json(content.home)})
			on conflict (key) do nothing`;

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
					${postImage(post.slug)}, ${post.published_at})`;
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

// --- Demo accounts (--demo) ---

async function seedDemo() {
	const users = [
		['admin@example.com', 'Academy Admin', 'admin', 'admin12345'],
		['student@example.com', 'Sample Student', 'student', 'student12345']
	];
	for (const [email, name, role, password] of users) {
		await sql`insert into users (email, name, role, password_hash)
			values (${email}, ${name}, ${role}, ${await hashPassword(password)}) on conflict (email) do nothing`;
	}
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
