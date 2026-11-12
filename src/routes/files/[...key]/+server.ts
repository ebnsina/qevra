import { error } from '@sveltejs/kit';
import { contentType, readFile } from '#lib/server/storage.ts';

import { UUID } from '#lib/server/form.ts';

// public/…                     anyone
// submissions/<user id>/…      that student, and staff
// lessons/<course id>/…        students enrolled in that course, and staff
async function mayRead(locals: App.Locals, area: string, owner: string) {
	const user = locals.user;
	if (area === 'public') return true;
	if (!user) return false;
	if (user.role === 'admin') return area === 'submissions' || area === 'lessons';
	if (area === 'submissions') return user.id === owner;
	if (area === 'lessons' && UUID.test(owner)) {
		const [enrolled] = await locals.db((tx) => tx`select 1 from enrollments where course_id = ${owner} and user_id = ${user.id}`);
		return Boolean(enrolled);
	}
	return false;
}

export async function GET({ params, locals }) {
	const [area, owner = ''] = params.key.split('/');
	if (!(await mayRead(locals, area, owner))) error(404, 'File not found');

	const file = await readFile(params.key);
	if (!file) error(404, 'File not found');
	return new Response(file.body, {
		headers: {
			'content-type': contentType(params.key),
			'x-content-type-options': 'nosniff',
			'cache-control': area === 'public' ? 'public, max-age=31536000, immutable' : 'private, no-store'
		}
	});
}
