import { getContent } from '#lib/server/content.ts';

export async function load({ locals }) {
	const { settings } = await locals.db(getContent);
	return { user: locals.user, settings };
}
