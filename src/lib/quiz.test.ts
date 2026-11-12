import { describe, expect, it } from 'vitest';
import { gradeQuiz } from './quiz.ts';

describe('gradeQuiz', () => {
	it('counts right answers and passes at 60%', () => {
		expect(gradeQuiz([1, 0, 2, 1, 0], [1, 0, 2, 0, 1])).toEqual({ score: 3, total: 5, passed: true });
	});
	it('fails below 60%', () => {
		expect(gradeQuiz([1, 0, 2], [1, 2, 0])).toEqual({ score: 1, total: 3, passed: false });
	});
	it('treats unanswered questions as wrong', () => {
		expect(gradeQuiz([0, 0], [0, undefined])).toEqual({ score: 1, total: 2, passed: false });
	});
	it('never passes a quiz with no questions', () => {
		expect(gradeQuiz([], []).passed).toBe(false);
	});
});
