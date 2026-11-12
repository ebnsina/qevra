export async function load({ locals }) {
	const payments = await locals.db((tx) => tx<{
		id: string; course: string; slug: string; method: string; sender_number: string; transaction_id: string;
		amount: number; status: 'pending' | 'approved' | 'rejected'; note: string; created_at: Date; reviewed_at: Date | null;
	}[]>`
		select p.id, c.title as course, c.slug, p.method, p.sender_number, p.transaction_id, p.amount, p.status, p.note,
			p.created_at, p.reviewed_at
		from payments p join courses c on c.id = p.course_id
		where p.user_id = ${locals.user!.id}
		order by p.created_at desc`);
	return { payments };
}
