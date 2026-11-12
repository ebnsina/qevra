import { error, redirect } from '@sveltejs/kit';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, userForSession } from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	const user = token ? await userForSession(token) : null;
	event.locals.user = user;
	event.locals.db = (fn) => db(user ?? 'anon', fn);

	// The one gate for both signed-in areas: every request passes through here.
	const { pathname } = event.url;
	const area = pathname.split('/')[1];
	if (area === 'portal' || area === 'admin') {
		if (!user) redirect(303, `/login?next=${encodeURIComponent(pathname)}`);
		if (area === 'admin' && user.role !== 'admin') error(403, 'This area is for staff only.');
	}
	return resolve(event);
};

export const handleError: HandleServerError = ({ error: cause, event, kind }) => {
	if (kind !== 'unknown') return;
	console.error(`${event.request.method} ${event.url.pathname} failed`, cause);
	return { message: 'Something went wrong on our side. Please try again.' };
};
