import { randomBytes } from 'node:crypto';
import { db } from './db.ts';

/**
 * Marks a lesson complete once its quiz is passed and its assignment is handed in (when it has
 * them). Finishing the last lesson completes the course and issues the certificate.
 * Runs as 'system': students can't write progress or certificates themselves.
 */
export async function completeLessonIfDone(userId: string, lessonId: string) {
	return db('system', async (tx) => {
		const [lesson] = await tx<{ course_id: string; quiz_ok: boolean; work_ok: boolean }[]>`
			select l.course_id,
				(not exists (select 1 from quiz_questions q where q.lesson_id = l.id)
					or exists (select 1 from quiz_attempts a where a.lesson_id = l.id and a.user_id = ${userId} and a.passed)) as quiz_ok,
				(l.assignment = ''
					or exists (select 1 from submissions s where s.lesson_id = l.id and s.user_id = ${userId})) as work_ok
			from lessons l
			join enrollments e on e.course_id = l.course_id and e.user_id = ${userId}
			where l.id = ${lessonId}`;
		if (!lesson || !lesson.quiz_ok || !lesson.work_ok) return false;

		await tx`insert into lesson_progress (user_id, lesson_id) values (${userId}, ${lessonId}) on conflict do nothing`;
		const [{ left }] = await tx<{ left: number }[]>`
			select count(*)::int as left from lessons l
			where l.course_id = ${lesson.course_id}
				and not exists (select 1 from lesson_progress p where p.lesson_id = l.id and p.user_id = ${userId})`;
		if (left === 0) {
			await tx`update enrollments set completed_at = coalesce(completed_at, now())
				where user_id = ${userId} and course_id = ${lesson.course_id}`;
			await tx`insert into certificates (code, user_id, course_id)
				values (${randomBytes(6).toString('hex').toUpperCase()}, ${userId}, ${lesson.course_id})
				on conflict (user_id, course_id) do nothing`;
		}
		return true;
	});
}

/** Opens a course for a student. Staff call this when a payment is approved; free courses use it directly. */
export async function enroll(userId: string, courseId: string) {
	await db('system', (tx) => tx`
		insert into enrollments (user_id, course_id) values (${userId}, ${courseId})
		on conflict (user_id, course_id) do nothing`);
}
