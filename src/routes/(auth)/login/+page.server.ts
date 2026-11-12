import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { afterLogin, login, startSession } from '#lib/server/auth.ts';
import { parseForm } from '#lib/server/form.ts';

const Login = v.object({
	email: v.pipe(v.string(), v.trim(), v.email('Enter your email address')),
	password: v.pipe(v.string(), v.minLength(1, 'Enter your password'))
});

export function load({ locals, url }) {
	if (locals.user) redirect(303, afterLogin(url.searchParams.get('next'), locals.user.role));
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const form = await parseForm(Login, request);
		if ('invalid' in form) return form.invalid;
		const result = await login(form.data.email, form.data.password);
		if ('error' in result) return fail(400, { code: result.error, values: { email: form.data.email } });
		await startSession(cookies, result.user.id);
		redirect(303, afterLogin(url.searchParams.get('next'), result.user.role));
	}
};
