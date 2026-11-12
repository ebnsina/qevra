import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { resetPassword } from '#lib/server/auth.ts';
import { parseForm } from '#lib/server/form.ts';

const Reset = v.object({ password: v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters'), v.maxLength(200)) });

export const actions = {
	default: async ({ request, params }) => {
		const form = await parseForm(Reset, request);
		if ('invalid' in form) return form.invalid;
		if (!(await resetPassword(params.token, form.data.password))) return fail(400, { code: 'reset_expired' });
		redirect(303, '/login?reset');
	}
};
