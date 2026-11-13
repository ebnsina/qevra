import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { phone } from './form.ts';

describe('phone', () => {
	it.each(['+880 1700-000000', '01700000000', ' 017-0000 0000 '])('accepts %s', (value) => {
		expect(v.safeParse(phone, value).success).toBe(true);
	});
	it.each(['', '   ', '12345', 'call me', '+880 1700-000000 ext 5'])('rejects %j', (value) => {
		expect(v.safeParse(phone, value).success).toBe(false);
	});
});
