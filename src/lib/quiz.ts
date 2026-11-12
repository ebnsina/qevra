/** Share of right answers needed to pass a quiz. */
export const PASS_MARK = 0.6;

/** Marks a quiz: `correct` is each question's right option, `answers` what the student chose. */
export function gradeQuiz(correct: number[], answers: (number | undefined)[]) {
	const score = correct.filter((right, i) => answers[i] === right).length;
	const total = correct.length;
	return { score, total, passed: total > 0 && score / total >= PASS_MARK };
}
