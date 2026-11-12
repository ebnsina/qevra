import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';

// Anyone with the certificate number can check it is real, so this reads as 'system'
// and returns only what is printed on the certificate.
export async function load({ params }) {
	const [certificate] = await db('system', (tx) => tx<{ code: string; student: string; course: string; issued_at: Date }[]>`
		select ce.code, u.name as student, c.title as course, ce.issued_at
		from certificates ce
		join users u on u.id = ce.user_id
		join courses c on c.id = ce.course_id
		where ce.code = ${params.code.toUpperCase()}`);
	if (!certificate) error(404, 'No certificate has this number. Check it and try again.');
	return { certificate };
}
