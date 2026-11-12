// Q&A, notes, reviews and coupons: who can read and write what, against the real database rules.
import { afterAll, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db.ts';
import { course, enrollStudent, owner, user } from './fixtures.ts';

afterAll(() => owner.end());
const denied = /row-level security|permission denied/;

describe('lesson Q&A', () => {
	it('is readable and writable only by students in the course', async () => {
		const [a, outsider, c] = [await user(), await user(), await course()];
		await enrollStudent(a.id, c.id);
		const ask = (who: typeof a) =>
			db(who, (tx) => tx`insert into lesson_posts (lesson_id, user_id, author_name, body) values (${c.lessonIds[0]}, ${who.id}, 'Name', 'Why?')`);
		await ask(a);
		await expect(ask(outsider)).rejects.toThrow(denied);
		expect(await db(a, (tx) => tx`select 1 from lesson_posts`)).toHaveLength(1);
		expect(await db(outsider, (tx) => tx`select 1 from lesson_posts`)).toHaveLength(0);
	});

	it('does not let a student post as the teacher or under another name', async () => {
		const [a, b, c] = [await user(), await user(), await course()];
		await enrollStudent(a.id, c.id);
		const post = (userId: string, byStaff: boolean) =>
			db(a, (tx) => tx`insert into lesson_posts (lesson_id, user_id, author_name, by_staff, body) values (${c.lessonIds[0]}, ${userId}, 'X', ${byStaff}, 'Hi')`);
		await expect(post(a.id, true)).rejects.toThrow(denied);
		await expect(post(b.id, false)).rejects.toThrow(denied);
	});
});

describe('personal notes', () => {
	it('are private to their writer, even from staff', async () => {
		const [a, b, admin, c] = [await user(), await user(), await user('admin'), await course()];
		await db(a, (tx) => tx`insert into lesson_notes (user_id, lesson_id, body) values (${a.id}, ${c.lessonIds[0]}, 'mine')`);
		expect(await db(a, (tx) => tx`select body from lesson_notes`)).toEqual([{ body: 'mine' }]);
		expect(await db(b, (tx) => tx`select 1 from lesson_notes`)).toHaveLength(0);
		expect(await db(admin, (tx) => tx`select 1 from lesson_notes`)).toHaveLength(0);
	});
});

describe('course reviews', () => {
	it('need an enrollment, start unapproved, and cannot be approved by their writer', async () => {
		const [a, outsider, c] = [await user(), await user(), await course()];
		await enrollStudent(a.id, c.id);
		const review = (who: typeof a, approved: boolean) =>
			db(who, (tx) => tx`insert into course_reviews (user_id, course_id, rating, author_name, approved) values (${who.id}, ${c.id}, 5, 'N', ${approved})`);
		await expect(review(outsider, false)).rejects.toThrow(denied);
		await expect(review(a, true)).rejects.toThrow(denied);
		await review(a, false);
		await expect(db(a, (tx) => tx`update course_reviews set approved = true where user_id = ${a.id}`)).rejects.toThrow(denied);
		// Until staff approve it, the public sees nothing.
		expect(await db('anon', (tx) => tx`select 1 from course_reviews where course_id = ${c.id}`)).toHaveLength(0);
		await owner`update course_reviews set approved = true where user_id = ${a.id}`;
		expect(await db('anon', (tx) => tx`select 1 from course_reviews where course_id = ${c.id}`)).toHaveLength(1);
	});
});

describe('coupons', () => {
	const check = (who: Parameters<typeof db>[0], code: string, courseId: string) =>
		db(who, (tx) => tx<{ percent_off: number }[]>`select percent_off from coupon_for(${code}, ${courseId})`);
	const code = (name: string) => `${name}${Date.now()}${Math.floor(performance.now())}`;

	it('cannot be listed by students, but one code can be checked', async () => {
		const [a, c, name] = [await user(), await course(), code('SAVE')];
		await owner`insert into coupons (code, percent_off) values (${name}, 20)`;
		expect(await db(a, (tx) => tx`select 1 from coupons`)).toHaveLength(0);
		expect(await check(a, name.toLowerCase(), c.id)).toEqual([{ percent_off: 20 }]);
		expect(await check(a, 'NOSUCHCODE', c.id)).toEqual([]);
	});

	it('stops working when switched off, expired, for another course, or used up', async () => {
		const [a, c, other] = [await user(), await course(), await course()];
		const [off, old, elsewhere, once] = [code('OFF'), code('OLD'), code('ELSE'), code('ONCE')];
		await owner`insert into coupons (code, percent_off, active) values (${off}, 10, false)`;
		await owner`insert into coupons (code, percent_off, expires_at) values (${old}, 10, now() - interval '1 day')`;
		await owner`insert into coupons (code, percent_off, course_id) values (${elsewhere}, 10, ${other.id})`;
		const [{ id }] = await owner`insert into coupons (code, percent_off, max_uses) values (${once}, 10, 1) returning id`;
		for (const name of [off, old, elsewhere]) expect(await check(a, name, c.id)).toEqual([]);

		expect(await check(a, once, c.id)).toHaveLength(1);
		await owner`insert into payments (user_id, course_id, method, sender_number, transaction_id, amount, coupon_id)
			values (${a.id}, ${c.id}, 'bkash', '01700000000', ${code('T')}, 90, ${id})`;
		expect(await check(a, once, c.id)).toEqual([]);
	});
});
