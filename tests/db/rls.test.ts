// What each kind of person can read and write, checked against the real database rules.
import { afterAll, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db.ts';
import { course, enrollStudent, owner, user } from './fixtures.ts';

afterAll(() => owner.end());

const denied = /row-level security|permission denied/;

describe('students', () => {
	it('see their own enrollments and nobody else\'s', async () => {
		const [a, b, c] = [await user(), await user(), await course()];
		await enrollStudent(a.id, c.id);
		expect(await db(a, (tx) => tx`select 1 from enrollments`)).toHaveLength(1);
		expect(await db(b, (tx) => tx`select 1 from enrollments`)).toHaveLength(0);
	});

	it('cannot enroll themselves without going through payment', async () => {
		const [a, c] = [await user(), await course()];
		await expect(db(a, (tx) => tx`insert into enrollments (user_id, course_id) values (${a.id}, ${c.id})`)).rejects.toThrow(denied);
	});

	it('can submit a pending payment for themselves only', async () => {
		const [a, b, c] = [await user(), await user(), await course()];
		const pay = (userId: string, status: string, txn: string) => (tx: Parameters<Parameters<typeof db>[1]>[0]) =>
			tx`insert into payments (user_id, course_id, method, sender_number, transaction_id, amount, status)
				values (${userId}, ${c.id}, 'bkash', '01700000000', ${txn}, 100, ${status})`;
		await db(a, pay(a.id, 'pending', `OWN${Date.now()}`));
		await expect(db(a, pay(a.id, 'approved', `APPROVED${Date.now()}`))).rejects.toThrow(denied);
		await expect(db(a, pay(b.id, 'pending', `OTHER${Date.now()}`))).rejects.toThrow(denied);
	});

	it('cannot approve their own payment', async () => {
		const [a, c] = [await user(), await course()];
		await owner`insert into payments (user_id, course_id, method, sender_number, transaction_id, amount)
			values (${a.id}, ${c.id}, 'bkash', '01700000000', ${`T${Date.now()}`}, 100)`;
		const changed = await db(a, (tx) => tx`update payments set status = 'approved' where user_id = ${a.id} returning id`);
		expect(changed).toHaveLength(0);
	});

	it('cannot make themselves an admin', async () => {
		const a = await user();
		await expect(db(a, (tx) => tx`update users set role = 'admin' where id = ${a.id}`)).rejects.toThrow(denied);
	});

	it('cannot read other people\'s accounts or anyone\'s sessions', async () => {
		const [a] = [await user(), await user()];
		expect(await db(a, (tx) => tx`select id from users`)).toEqual([{ id: a.id }]);
		expect(await db(a, (tx) => tx`select 1 from sessions`)).toHaveLength(0);
	});

	it('cannot mark lessons complete or issue certificates directly', async () => {
		const [a, c] = [await user(), await course()];
		await enrollStudent(a.id, c.id);
		await expect(db(a, (tx) => tx`insert into lesson_progress (user_id, lesson_id) values (${a.id}, ${c.lessonIds[0]})`)).rejects.toThrow(denied);
		await expect(db(a, (tx) => tx`insert into certificates (code, user_id, course_id) values ('FAKE', ${a.id}, ${c.id})`)).rejects.toThrow(denied);
	});

	it('cannot change course content', async () => {
		const [a, c] = [await user(), await course()];
		await expect(db(a, (tx) => tx`insert into courses (slug, title) values ('sneaky', 'Sneaky')`)).rejects.toThrow(denied);
		expect(await db(a, (tx) => tx`update courses set title = 'Hacked' where id = ${c.id} returning id`)).toHaveLength(0);
	});
});

describe('visitors', () => {
	it('can read courses but no accounts or student records', async () => {
		const [a, c] = [await user(), await course()];
		await enrollStudent(a.id, c.id);
		expect((await db('anon', (tx) => tx`select 1 from courses where id = ${c.id}`)).length).toBe(1);
		expect(await db('anon', (tx) => tx`select 1 from users`)).toHaveLength(0);
		expect(await db('anon', (tx) => tx`select 1 from enrollments`)).toHaveLength(0);
	});
});

describe('admins', () => {
	it('see every student\'s records and can edit content', async () => {
		const [admin, a, c] = [await user('admin'), await user(), await course()];
		await enrollStudent(a.id, c.id);
		expect((await db(admin, (tx) => tx`select 1 from enrollments where user_id = ${a.id}`)).length).toBe(1);
		expect(await db(admin, (tx) => tx`update courses set title = 'Renamed' where id = ${c.id} returning id`)).toHaveLength(1);
	});
});
