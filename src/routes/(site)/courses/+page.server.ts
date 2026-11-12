import { listPublishedCourses } from '#lib/server/courses.ts';

export async function load({ locals }) {
	return { courses: await locals.db((tx) => listPublishedCourses(tx)) };
}
