import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { getContent } from '#lib/server/content.ts';
import { isConflict } from '#lib/server/db.ts';
import { parseForm, requiredText } from '#lib/server/form.ts';
import { enroll } from '#lib/server/learning.ts';
import { discounted } from '#lib/pricing.ts';

const Payment = v.object({
	method: v.picklist(['bkash', 'nagad'], 'Choose how you paid'),
	sender_number: v.pipe(requiredText(20), v.regex(/^\+?[\d\s-]{10,}$/, 'Enter the mobile number you paid from')),
	transaction_id: v.pipe(requiredText(40), v.regex(/^[A-Za-z0-9]{6,}$/, 'Enter the transaction ID from your payment message'), v.toUpperCase()),
	coupon: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(40)), '')
});

/** What a coupon code takes off this course right now; null when there is no code or it can't be used. */
async function couponFor(locals: App.Locals, code: string, courseId: string) {
	if (!code) return null;
	const [coupon] = await locals.db((tx) => tx<{ id: string; percent_off: number }[]>`
		select id, percent_off from coupon_for(${code}, ${courseId})`);
	return coupon ?? null;
}

async function findCourse(locals: App.Locals, slug: string) {
	const [course] = await locals.db((tx) => tx<{ id: string; slug: string; title: string; summary: string; price: number; regular_price: number | null; enrollment_open: boolean }[]>`
		select id, slug, title, summary, price, regular_price, enrollment_open from courses where slug = ${slug} and published`);
	if (!course) error(404, 'Course not found');
	// One check for the page and both of its actions: a course that isn't open can't be joined or paid for.
	if (!course.enrollment_open) error(403, 'This course is not open for enrollment yet.');
	return course;
}

export async function load({ locals, params, url }) {
	const userId = locals.user!.id;
	const course = await findCourse(locals, params.slug);
	const code = (url.searchParams.get('coupon') ?? '').trim().slice(0, 40);
	const coupon = await couponFor(locals, code, course.id);
	return locals.db(async (tx) => {
		const [enrolled] = await tx`select 1 from enrollments where course_id = ${course.id} and user_id = ${userId}`;
		if (enrolled) redirect(303, `/portal/courses/${course.slug}`);
		const [payment] = await tx<{ status: string; note: string; transaction_id: string; created_at: Date }[]>`
			select status, note, transaction_id, created_at from payments
			where course_id = ${course.id} and user_id = ${userId}
			order by created_at desc limit 1`;
		const { settings } = await getContent(tx);
		return {
			course,
			payment: payment ?? null,
			// The code they typed, whether it works, and what they pay with it.
			coupon: code ? { code, percent: coupon?.percent_off ?? null } : null,
			amount: coupon ? discounted(course.price, coupon.percent_off) : course.price,
			pay: { bkash: settings.bkash_number, nagad: settings.nagad_number, note: settings.payment_note }
		};
	});
}

export const actions = {
	free: async ({ locals, params }) => {
		const course = await findCourse(locals, params.slug);
		if (course.price !== 0) error(400, 'This course is not free.');
		await enroll(locals.user!.id, course.id);
		redirect(303, `/portal/courses/${course.slug}`);
	},

	pay: async ({ locals, params, request }) => {
		const form = await parseForm(Payment, request);
		if ('invalid' in form) return form.invalid;
		const course = await findCourse(locals, params.slug);
		// The discount is worked out again here: the amount on the form is never trusted.
		const coupon = await couponFor(locals, form.data.coupon, course.id);
		if (form.data.coupon && !coupon) return fail(400, { code: 'coupon_invalid', values: form.data });
		const amount = coupon ? discounted(course.price, coupon.percent_off) : course.price;
		try {
			await locals.db((tx) => tx`
				insert into payments (user_id, course_id, method, sender_number, transaction_id, amount, coupon_id)
				values (${locals.user!.id}, ${course.id}, ${form.data.method}, ${form.data.sender_number},
					${form.data.transaction_id}, ${amount}, ${coupon?.id ?? null})`);
		} catch (e) {
			if (!isConflict(e, '23505')) throw e;
			const pending = (e as { constraint_name?: string }).constraint_name === 'payments_one_pending';
			return fail(409, { code: pending ? 'payment_pending' : 'transaction_used', values: form.data });
		}
		return { sent: true };
	}
};
