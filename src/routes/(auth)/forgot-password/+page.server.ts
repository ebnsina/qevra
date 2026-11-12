import * as v from 'valibot';
import { requestPasswordReset } from '#lib/server/auth.ts';
import { parseForm } from '#lib/server/form.ts';

const Forgot = v.object({ email: v.pipe(v.string(), v.trim(), v.email('Enter your email address')) });

export const actions = {
	default: async ({ request, url }) => {
		const form = await parseForm(Forgot, request);
		if ('invalid' in form) return form.invalid;
		await requestPasswordReset(form.data.email, url.origin);
		// The same answer whether or not the account exists, so this can't be used to find accounts.
		return { sent: true };
	}
};
