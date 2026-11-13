import { describe, expect, it, vi } from 'vitest';

// The helper under test is pure; the module's other imports only exist in the app.
vi.mock('$app/forms', () => ({ deserialize: () => ({}) }));
vi.mock('$app/navigation', () => ({ goto: () => {} }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://x/admin') } }));
vi.mock('#lib/sinaui/ui/toast/index.ts', () => ({ toast: { error: () => {} } }));
const { withRow } = await import('./admin-query.svelte.ts');

describe('withRow', () => {
	const data = { show: 'waiting', rows: [{ id: 'a', n: 1 }, { id: 'b', n: 2 }], courses: [{ id: 'c' }] };

	it('takes a row out of the list that holds it', () => {
		expect(withRow(data, 'a', null)).toEqual({ show: 'waiting', rows: [{ id: 'b', n: 2 }], courses: [{ id: 'c' }] });
	});
	it('changes one row and leaves the others', () => {
		expect(withRow(data, 'b', { n: 5 }).rows).toEqual([{ id: 'a', n: 1 }, { id: 'b', n: 5 }]);
	});
	it('leaves the data alone when no list has that row', () => {
		expect(withRow(data, 'zz', null)).toEqual(data);
	});
	it('does not change the data it was given', () => {
		withRow(data, 'a', { n: 9 });
		expect(data.rows[0].n).toBe(1);
	});
});
