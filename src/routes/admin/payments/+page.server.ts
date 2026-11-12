import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { id, parseForm, text } from '#lib/server/form.ts';

const Review = v.object({ id, note: text(300) });

export async function load({ locals, url }) {
	const status = url.searchParams.get('status') === 'all' ? 'all' : 'pending';
	const payments = await locals.db((tx) => tx<{
		id: string; student: string; email: string; phone: string; course: string; method: string; sender_number: string;
		transaction_id: string; amount: number; status: 'pending' | 'approved' | 'rejected'; note: string; created_at: Date; reviewed_at: Date | null;
	}[]>`
		select p.id, u.name as student, u.email, u.phone, c.title as course, p.method, p.sender_number, p.transaction_id,
			p.amount, p.status, p.note, p.created_at, p.reviewed_at
		from payments p join users u on u.id = p.user_id join courses c on c.id = p.course_id
		${status === 'pending' ? tx`where p.status = 'pending'` : tx``}
		order by p.created_at desc limit 500`);
	return { payments, status };
}

export const actions = {
	// Confirms the payment and opens the course, together: one can't happen without the other.
	approve: async ({ locals, request }) => {
		const form = await parseForm(Review, request);
		if ('invalid' in form) return form.invalid;
		const done = await locals.db(async (tx) => {
			const [payment] = await tx<{ user_id: string; course_id: string }[]>`
				update payments set status = 'approved', note = ${form.data.note}, reviewed_at = now()
				where id = ${form.data.id} and status = 'pending' returning user_id, course_id`;
			if (!payment) return false;
			await tx`insert into enrollments (user_id, course_id) values (${payment.user_id}, ${payment.course_id})
				on conflict (user_id, course_id) do nothing`;
			return true;
		});
		if (!done) return fail(409, { code: 'already_reviewed' });
	},

	reject: async ({ locals, request }) => {
		const form = await parseForm(Review, request);
		if ('invalid' in form) return form.invalid;
		const [payment] = await locals.db((tx) => tx`
			update payments set status = 'rejected', note = ${form.data.note}, reviewed_at = now()
			where id = ${form.data.id} and status = 'pending' returning id`);
		if (!payment) return fail(409, { code: 'already_reviewed' });
	}
};
