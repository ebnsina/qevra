import { error } from '@sveltejs/kit';
import { contentType, readFile } from '#lib/server/storage.ts';

// public/…                     anyone
// submissions/<user id>/…      that student, and staff
export async function GET({ params, locals }) {
	const [area, owner] = params.key.split('/');
	const user = locals.user;
	const allowed = area === 'public' || (area === 'submissions' && user && (user.role === 'admin' || user.id === owner));
	if (!allowed) error(404, 'File not found');

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
