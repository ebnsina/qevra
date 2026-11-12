export async function load({ locals }) {
	const resources = await locals.db((tx) => tx<{ id: string; title: string; description: string; file_key: string; file_name: string }[]>`
		select id, title, description, file_key, file_name from resources order by position, title`);
	return { resources };
}
