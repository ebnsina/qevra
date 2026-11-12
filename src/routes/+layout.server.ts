import { getContent } from '#lib/server/content.ts';

export async function load({ locals }) {
	const { settings, home } = await locals.db(getContent);
	// The closing banner's words, shared by the public pages.
	return { user: locals.user, settings, closing: { title: home.closing_title, text: home.closing_text } };
}
