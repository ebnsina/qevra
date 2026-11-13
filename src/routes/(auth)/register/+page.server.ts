import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { afterLogin, register, startSession } from '#lib/server/auth.ts';
import { parseForm, phone, requiredText } from '#lib/server/form.ts';

const Register = v.object({
	name: requiredText(80),
	email: v.pipe(v.string(), v.trim(), v.email('Enter a valid email address'), v.maxLength(200)),
	phone,
	password: v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters'), v.maxLength(200))
});

export function load({ locals }) {
	if (locals.user) redirect(303, afterLogin(null, locals.user.role));
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const form = await parseForm(Register, request);
		if ('invalid' in form) return form.invalid;
		const result = await register(form.data);
		if ('error' in result) {
			const { password: _, ...values } = form.data;
			return fail(400, { code: result.error, values });
		}
		await startSession(cookies, result.user.id);
		redirect(303, afterLogin(url.searchParams.get('next'), 'student'));
	}
};
