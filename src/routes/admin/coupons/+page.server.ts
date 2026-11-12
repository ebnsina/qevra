import * as v from 'valibot';
import { fromLocalInput } from '#lib/format.ts';
import { deleteRow, saveRow } from '#lib/server/admin.ts';
import { UUID, checkbox, optionalId, optionalNumber, parseForm, wholeNumber } from '#lib/server/form.ts';

const Coupon = v.object({
	id: optionalId,
	code: v.pipe(v.string(), v.trim(), v.toUpperCase(), v.regex(/^[A-Z0-9_-]{3,30}$/, 'Use 3 to 30 letters and numbers, like WELCOME10')),
	percent_off: v.pipe(wholeNumber, v.minValue(1, 'Enter 1 to 100'), v.maxValue(100, 'Enter 1 to 100')),
	course_id: v.pipe(v.optional(v.string(), ''), v.check((s) => s === '' || UUID.test(s), 'Choose a course from the list'), v.transform((s) => s || null)),
	expires_at: v.pipe(
		v.optional(v.string(), ''),
		v.check((s) => s === '' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s), 'Choose a date and time, or leave it empty'),
		v.transform((s) => (s ? fromLocalInput(s) : null))
	),
	max_uses: v.pipe(optionalNumber, v.check((n) => n === null || n > 0, 'Enter 1 or more, or leave it empty')),
	active: checkbox
});

export async function load({ locals }) {
	return locals.db(async (tx) => {
		const coupons = await tx<{ id: string; code: string; percent_off: number; course_id: string | null; course: string | null; expires_at: Date | null; max_uses: number | null; active: boolean; uses: number }[]>`
			select k.id, k.code, k.percent_off, k.course_id, c.title as course, k.expires_at, k.max_uses, k.active,
				(select count(*)::int from payments p where p.coupon_id = k.id and p.status <> 'rejected') as uses
			from coupons k left join courses c on c.id = k.course_id
			order by k.created_at desc`;
		const courses = await tx<{ id: string; title: string }[]>`select id, title from courses order by position, title`;
		return { coupons, courses };
	});
}

export const actions = {
	save: async ({ locals, request }) => {
		const form = await parseForm(Coupon, request);
		if ('invalid' in form) return form.invalid;
		const { id, ...row } = form.data;
		return saveRow(locals.db, 'coupons', id, row);
	},
	delete: async ({ locals, request }) => deleteRow(locals.db, 'coupons', await request.formData())
};
