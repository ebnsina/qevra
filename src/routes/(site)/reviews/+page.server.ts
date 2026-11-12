export async function load({ locals }) {
	const reviews = await locals.db((tx) => tx<{ id: string; name: string; affiliation: string; body: string; rating: number }[]>`
		select id, name, affiliation, body, rating from reviews order by position, name`);
	return { reviews };
}
