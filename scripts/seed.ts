// Fills a new setup with the academy's real content (scripts/content). Safe to run twice.
//
//   node --env-file=.env scripts/seed.ts          content only: use this for production
//   node --env-file=.env scripts/seed.ts --demo   also demo accounts, sample lessons and sample downloads,
//                                                 for local work and tests. Never on production: the
//                                                 demo passwords are public.
import { readFile, readdir } from 'node:fs/promises';
import { AwsClient } from 'aws4fetch';
import postgres from 'postgres';
import { hashPassword } from '../src/lib/server/password.ts';

interface Course {
	slug: string;
	title: string;
	level: string;
	price: number;
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

const demo = process.argv.includes('--demo');
const env = (name: string) => {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
};

const dir = new URL('./content/', import.meta.url);
const content: Content = JSON.parse(await readFile(new URL('delta.json', dir), 'utf8'));
const partnerFiles = (await readdir(new URL('partners/', dir))).sort();
const sql = postgres(env('DATABASE_URL'), { max: 1, onnotice: () => {} });

// Where each file lives in storage. The database rows below point at the same keys.
const LOGO = 'public/site/logo.png';
const courseImage = (slug: string) => `public/courses/${slug}.jpg`;
const partnerImage = (file: string) => `public/partners/${file}`;
const postImage = (slug: string) => `public/posts/${slug}.jpg`;
const demoResource = (index: number) => `public/resources/demo-${index + 1}.pdf`;

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
	if (demo) for (const [i, [title]] of demoResources.entries()) await upload(demoResource(i), placeholderPdf(title));
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
				insert into courses (slug, title, level, price, summary, description, outcomes, requirements,
					image_key, published, enrollment_open, position)
				values (${course.slug}, ${course.title}, ${course.level}, ${course.price}, ${course.summary},
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

// --- Demo only ---

const DEMO_VIDEO = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
const DEMO_COURSES = ['english-for-beginners', 'english-for-job-seekers', 'english-for-complete-idiots'];
const demoResources = [
	['The Oxford 3000', 'Master the 3000 most important words in English selected by experts at Oxford University Press.'],
	['Regular Verbs', 'Essential regular verbs you must know: simple, clean, and easy to remember.'],
	['Irregular Verbs', 'Download and memorize the most common irregular verbs for accurate speaking and writing.']
];
const demoLessons = [
	{
		title: 'Getting started',
		lessons: [
			{ title: 'How this course works', preview: true, body: 'Welcome. Watch each lesson, then mark it complete to move on.' },
			{ title: 'Introducing yourself', body: 'Practise saying your name, where you are from and what you do.' }
		]
	},
	{
		title: 'Everyday English',
		lessons: [
			{
				title: 'Asking questions',
				body: 'Questions with *do*, *does*, *is* and *are*.',
				quiz: [
					['Which question is correct?', ['Where you live?', 'Where do you live?', 'Where does you live?'], 1],
					['Choose the right word: "___ she a teacher?"', ['Do', 'Is', 'Are'], 1],
					['Choose the right word: "___ they work here?"', ['Do', 'Does', 'Is'], 0]
				]
			},
			{
				title: 'Write about your day',
				body: 'Use what you have learned so far.',
				assignment: 'Write 8 to 10 sentences about what you did yesterday. Upload it as a PDF, Word file or a clear photo.'
			}
		]
	}
] as const;

/** A one-page PDF with a single line of text: a stand-in for a real download. */
function placeholderPdf(text: string) {
	const stream = `BT /F1 24 Tf 72 760 Td (${text}) Tj ET`;
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
	];
	let body = '%PDF-1.4\n';
	const offsets = objects.map((object, i) => {
		const at = body.length;
		body += `${i + 1} 0 obj\n${object}\nendobj\n`;
		return at;
	});
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const at of offsets) body += `${String(at).padStart(10, '0')} 00000 n \n`;
	return `${body}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}

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

		// Sample lessons, a quiz, an assignment and a live class, so the whole flow can be tried.
		for (const slug of DEMO_COURSES) {
			const [course] = await tx`
				select c.id from courses c
				where c.slug = ${slug} and not exists (select 1 from modules m where m.course_id = c.id)`;
			if (!course) continue;
			let position = 0;
			for (const [m, module] of demoLessons.entries()) {
				const [{ id: moduleId }] = await tx`
					insert into modules (course_id, title, position) values (${course.id}, ${module.title}, ${m}) returning id`;
				for (const lesson of module.lessons) {
					const [{ id: lessonId }] = await tx`
						insert into lessons (course_id, module_id, title, position, video_url, body, assignment, is_preview)
						values (${course.id}, ${moduleId}, ${lesson.title}, ${position++}, ${DEMO_VIDEO}, ${lesson.body},
							${'assignment' in lesson ? lesson.assignment : ''}, ${'preview' in lesson})
						returning id`;
					if (!('quiz' in lesson)) continue;
					for (const [q, [question, options, correct]] of lesson.quiz.entries()) {
						await tx`insert into quiz_questions (lesson_id, question, options, correct, position)
							values (${lessonId}, ${question}, ${[...options]}, ${correct}, ${q})`;
					}
				}
			}
			await tx`insert into live_classes (course_id, title, starts_at, meeting_url)
				values (${course.id}, 'Live question and answer session', now() + interval '3 days', 'https://meet.google.com/')`;
			console.log(`sample lessons added to ${slug}`);
		}

		if (!(await tx`select 1 from resources limit 1`).length) {
			for (const [i, [title, description]] of demoResources.entries()) {
				await tx`insert into resources (title, description, file_key, file_name, position)
					values (${title}, ${description}, ${demoResource(i)}, ${`${title}.pdf`}, ${i})`;
			}
		}
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
if (demo) {
	await seedDemo();
	await openCoursesWithLessons();
} else {
	console.log('No courses are open for enrollment yet: add lessons in the admin area, then switch each course on.');
}
await sql.end();
