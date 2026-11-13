import { error } from '@sveltejs/kit';
import { embedUrl } from '#lib/embed.ts';
import { getContent } from '#lib/server/content.ts';
import { renderMarkdown } from '#lib/server/markdown.ts';

interface Course {
	id: string;
	slug: string;
	title: string;
	summary: string;
	description: string;
	outcomes: string;
	requirements: string;
	level: string;
	price: number;
	image_key: string | null;
	enrollment_open: boolean;
	regular_price: number | null;
}

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

export async function load({ locals, params }) {
	return locals.db(async (tx) => {
		const [course] = await tx<Course[]>`
			select id, slug, title, summary, description, outcomes, requirements, level, price, image_key, enrollment_open, regular_price
			from courses where slug = ${params.slug} and published`;
		if (!course) error(404, 'Course not found');

		// Sent together: one trip to the database instead of one per query.
		const [
			modules,
			lessons,
			[{ live }],
			[enrollment],
			reviews,
			[{ downloads }],
			{ home }
		] = await Promise.all([
		tx<{ id: string; title: string }[]>`
			select id, title from modules where course_id = ${course.id} order by position, title`,
		// Only free-preview lessons give out their video; the rest show their title.
		tx<{ id: string; module_id: string; title: string; is_preview: boolean; video_url: string; has_quiz: boolean; has_assignment: boolean }[]>`
			select l.id, l.module_id, l.title, l.is_preview,
				case when l.is_preview then l.video_url else '' end as video_url,
				exists (select 1 from quiz_questions q where q.lesson_id = l.id) as has_quiz,
				l.assignment <> '' as has_assignment
			from lessons l where l.course_id = ${course.id} order by l.position, l.title`,
		tx<{ live: number }[]>`
			select count(*)::int as live from live_classes where course_id = ${course.id} and starts_at > now()`,
		locals.user
			? tx`select 1 from enrollments where course_id = ${course.id} and user_id = ${locals.user.id}`
			: [],
		tx<{ id: string; author_name: string; rating: number; body: string; created_at: Date }[]>`
			select id, author_name, rating, body, created_at from course_reviews
			where course_id = ${course.id} and approved order by created_at desc limit 30`,
		tx<{ downloads: number }[]>`
			select count(*)::int as downloads from lesson_files f join lessons l on l.id = f.lesson_id where l.course_id = ${course.id}`,
		getContent(tx),
		]);

		const preview = lessons.find((l) => l.is_preview && embedUrl(l.video_url));
		const { description, outcomes, requirements, ...rest } = course;
		return {
			course: rest,
			html: renderMarkdown(description),
			outcomes: lines(outcomes),
			requirements: lines(requirements),
			modules: modules.map((m) => ({
				...m,
				lessons: lessons
					.filter((l) => l.module_id === m.id)
					.map(({ id, title, is_preview, has_quiz, has_assignment }) => ({ id, title, is_preview, has_quiz, has_assignment }))
			})),
			counts: {
				lessons: lessons.length,
				quizzes: lessons.filter((l) => l.has_quiz).length,
				assignments: lessons.filter((l) => l.has_assignment).length,
				live,
				downloads
			},
			reviews,
			rating: reviews.length ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : null,
			preview: preview ? { title: preview.title, src: embedUrl(preview.video_url)! } : null,
			instructor: home.about_name ? { name: home.about_name, role: home.about_role, text: home.about_text } : null,
			enrolled: Boolean(enrollment)
		};
	});
}
