import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.ts';

describe('passwords', () => {
	it('verifies the right password and rejects a wrong one', async () => {
		const hash = await hashPassword('correct horse');
		expect(await verifyPassword('correct horse', hash)).toBe(true);
		expect(await verifyPassword('wrong horse', hash)).toBe(false);
	});
	it('never stores the password itself, and salts each hash', async () => {
		const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
		expect(a).not.toContain('same');
		expect(a).not.toBe(b);
	});
	it('rejects a stored value it does not understand', async () => {
		expect(await verifyPassword('anything', 'plain-text')).toBe(false);
	});
});
