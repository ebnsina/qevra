export async function load({ locals }) {
	const [counts] = await locals.db((tx) => tx<{ payments: number; submissions: number }[]>`
		select
			(select count(*)::int from payments where status = 'pending') as payments,
			(select count(*)::int from submissions where reviewed_at is null) as submissions`);
	return { waiting: counts };
}
