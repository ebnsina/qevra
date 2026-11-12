import { describe, expect, it } from 'vitest';
import { onColor } from './color.ts';
import { pairs } from './content.ts';

describe('pairs', () => {
	it('splits "first | second" lines and skips empty ones', () => {
		expect(pairs('12,000+ | students\n\n10 | courses \nJust a title')).toEqual([
			{ first: '12,000+', second: 'students' },
			{ first: '10', second: 'courses' },
			{ first: 'Just a title', second: '' }
		]);
	});
	it('gives nothing for empty text', () => {
		expect(pairs('')).toEqual([]);
	});
});

describe('onColor', () => {
	it('puts white text on a dark brand color and dark text on a light one', () => {
		expect(onColor('#0047ab')).toBe('#ffffff');
		expect(onColor('#ffd23f')).toBe('#0f0f10');
	});
});
