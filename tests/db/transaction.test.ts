// The transaction helper itself: all-or-nothing writes, and no leftovers on a reused connection.
import { afterAll, expect, it } from 'vitest';
import { db } from '#lib/server/db.ts';
import { course, owner, user } from './fixtures.ts';

afterAll(() => owner.end());
const note = (who: { id: string }, lesson: string, body: string) => (tx: Parameters<Parameters<typeof db>[1]>[0]) =>
	tx`insert into lesson_notes (user_id, lesson_id, body) values (${who.id}, ${lesson}, ${body})`;

it('undoes every write when a later step fails', async () => {
	const [a, c] = [await user(), await course()];
	await expect(
		db(a, async (tx) => {
			await note(a, c.lessonIds[0], 'kept?')(tx);
			throw new Error('stop');
		})
	).rejects.toThrow('stop');
	await expect(
		db(a, async (tx) => {
			await note(a, c.lessonIds[0], 'kept?')(tx);
			await tx`select no_such_column from lesson_notes`;
		})
	).rejects.toThrow(/no_such_column/);
	expect(await db(a, (tx) => tx`select 1 from lesson_notes`)).toHaveLength(0);
});

it('keeps a single write, and a failed one leaves the connection clean for the next person', async () => {
	const [a, b, c] = [await user(), await user(), await course()];
	await db(a, note(a, c.lessonIds[0], 'mine'));
	await expect(db(a, (tx) => tx`select no_such_column from lesson_notes`)).rejects.toThrow(/no_such_column/);
	// Many at once, so connections are reused: each still sees only its own rows.
	const seen = await Promise.all(Array.from({ length: 12 }, (_, i) => db(i % 2 ? a : b, (tx) => tx`select body from lesson_notes`)));
	seen.forEach((rows, i) => expect(rows).toHaveLength(i % 2 ? 1 : 0));
	expect(await db('anon', (tx) => tx`select current_setting('app.role') as role`)).toEqual([{ role: 'anon' }]);
});
