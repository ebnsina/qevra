import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { parseForm, phone, requiredText } from '#lib/server/form.ts';
import { hashPassword, verifyPassword } from '#lib/server/password.ts';

const Profile = v.object({ name: requiredText(80), phone });
const Password = v.object({
	current_password: v.pipe(v.string(), v.minLength(1, 'Enter your current password')),
	new_password: v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters'), v.maxLength(200))
});

export const actions = {
	profile: async ({ locals, request }) => {
		const form = await parseForm(Profile, request);
		if ('invalid' in form) return form.invalid;
		await locals.db((tx) => tx`
			update users set name = ${form.data.name}, phone = ${form.data.phone} where id = ${locals.user!.id}`);
		return { saved: 'profile' as const };
	},

	password: async ({ locals, request }) => {
		const form = await parseForm(Password, request);
		if ('invalid' in form) return form.invalid;
		const userId = locals.user!.id;
		const [{ password_hash }] = await locals.db((tx) => tx<{ password_hash: string }[]>`
			select password_hash from users where id = ${userId}`);
		if (!(await verifyPassword(form.data.current_password, password_hash))) return fail(400, { code: 'wrong_password' });
		const hash = await hashPassword(form.data.new_password);
		await locals.db((tx) => tx`update users set password_hash = ${hash} where id = ${userId}`);
		return { saved: 'password' as const };
	}
};
