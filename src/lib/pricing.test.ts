import { describe, expect, it } from 'vitest';
import { discounted } from './pricing.ts';

describe('discounted', () => {
	it('takes the percentage off and rounds to whole taka', () => {
		expect(discounted(5000, 10)).toBe(4500);
		expect(discounted(999, 15)).toBe(849);
	});
	it('is free at 100% and unchanged at 0%', () => {
		expect(discounted(999, 100)).toBe(0);
		expect(discounted(999, 0)).toBe(999);
	});
});
