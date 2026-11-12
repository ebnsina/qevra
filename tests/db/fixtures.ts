// Rows the database tests share, written as the owner (who is not held back by row-level security).
import postgres from 'postgres';

export const owner = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });

let n = 0;
export async function user(role: 'student' | 'admin' = 'student') {
	const [row] = await owner<{ id: string; role: 'student' | 'admin' }[]>`
		insert into users (email, name, role, password_hash)
		values (${`user${++n}-${Date.now()}@example.com`}, ${`User ${n}`}, ${role}, 'x') returning id, role`;
	return row;
}

/** A published course with one section and `lessons` plain lessons. */
export async function course(lessons = 1) {
	const [{ id }] = await owner<{ id: string }[]>`
		insert into courses (slug, title, published) values (${`course-${++n}-${Date.now()}`}, 'Course', true) returning id`;
	const [{ id: moduleId }] = await owner<{ id: string }[]>`insert into modules (course_id, title) values (${id}, 'Section') returning id`;
	const lessonIds: string[] = [];
	for (let i = 0; i < lessons; i++) {
		const [lesson] = await owner<{ id: string }[]>`
			insert into lessons (course_id, module_id, title, position) values (${id}, ${moduleId}, ${`Lesson ${i + 1}`}, ${i}) returning id`;
		lessonIds.push(lesson.id);
	}
	return { id, lessonIds };
}

export const enrollStudent = (userId: string, courseId: string) =>
	owner`insert into enrollments (user_id, course_id) values (${userId}, ${courseId})`;
