import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, deleteSession } from '#lib/server/auth.ts';

export async function POST({ cookies }) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await deleteSession(token);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	redirect(303, '/');
}
