// Finishing lessons, courses and certificates, against the real database.
import { afterAll, describe, expect, it } from 'vitest';
import { completeLessonIfDone, enroll } from '#lib/server/learning.ts';
import { course, enrollStudent, owner, user } from './fixtures.ts';

afterAll(() => owner.end());

const certificates = (userId: string) => owner`select code from certificates where user_id = ${userId}`;

describe('completeLessonIfDone', () => {
	it('does nothing for someone who is not enrolled', async () => {
		const [a, c] = [await user(), await course()];
		expect(await completeLessonIfDone(a.id, c.lessonIds[0])).toBe(false);
		expect(await owner`select 1 from lesson_progress where user_id = ${a.id}`).toHaveLength(0);
	});

	it('issues one certificate when the last lesson is finished, and not before', async () => {
		const [a, c] = [await user(), await course(2)];
		await enrollStudent(a.id, c.id);

		expect(await completeLessonIfDone(a.id, c.lessonIds[0])).toBe(true);
		expect(await certificates(a.id)).toHaveLength(0);

		expect(await completeLessonIfDone(a.id, c.lessonIds[1])).toBe(true);
		// Finishing a lesson twice must not issue a second certificate.
		await completeLessonIfDone(a.id, c.lessonIds[1]);
		expect(await certificates(a.id)).toHaveLength(1);
		const [enrollment] = await owner`select completed_at from enrollments where user_id = ${a.id}`;
		expect(enrollment.completed_at).not.toBeNull();
	});

	it('keeps a quiz lesson open until the quiz is passed', async () => {
		const [a, c] = [await user(), await course()];
		const lesson = c.lessonIds[0];
		await enrollStudent(a.id, c.id);
		await owner`insert into quiz_questions (lesson_id, question, options, correct) values (${lesson}, 'Q', ${['a', 'b']}, 0)`;

		expect(await completeLessonIfDone(a.id, lesson)).toBe(false);
		await owner`insert into quiz_attempts (user_id, lesson_id, score, total, passed) values (${a.id}, ${lesson}, 0, 1, false)`;
		expect(await completeLessonIfDone(a.id, lesson)).toBe(false);
		await owner`insert into quiz_attempts (user_id, lesson_id, score, total, passed) values (${a.id}, ${lesson}, 1, 1, true)`;
		expect(await completeLessonIfDone(a.id, lesson)).toBe(true);
	});

	it('keeps an assignment lesson open until work is handed in', async () => {
		const [a, c] = [await user(), await course()];
		const lesson = c.lessonIds[0];
		await enrollStudent(a.id, c.id);
		await owner`update lessons set assignment = 'Write something' where id = ${lesson}`;

		expect(await completeLessonIfDone(a.id, lesson)).toBe(false);
		await owner`insert into submissions (user_id, lesson_id, file_key, file_name) values (${a.id}, ${lesson}, 'k', 'work.pdf')`;
		expect(await completeLessonIfDone(a.id, lesson)).toBe(true);
	});
});

describe('enroll', () => {
	it('is safe to call twice', async () => {
		const [a, c] = [await user(), await course()];
		await enroll(a.id, c.id);
		await enroll(a.id, c.id);
		expect(await owner`select 1 from enrollments where user_id = ${a.id}`).toHaveLength(1);
	});
});
