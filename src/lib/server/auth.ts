import { createHash, randomBytes } from 'node:crypto';
import { db, isConflict, type Role } from './db.ts';
import { hashPassword, verifyPassword } from './password.ts';
import { sendMail } from './mail.ts';

export const SESSION_COOKIE = 'session';
const SESSION_DAYS = 30;
const RESET_MINUTES = 60;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export interface User {
	id: string;
	email: string;
	name: string;
	phone: string;
	role: Role;
}

const newToken = () => randomBytes(32).toString('base64url');
// Only the hash is stored, so a leaked database can't be used to sign in.
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string) {
	const token = newToken();
	const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
	await db('system', (tx) => tx`insert into sessions (id, user_id, expires_at) values (${digest(token)}, ${userId}, ${expires})`);
	return { token, expires };
}

export async function userForSession(token: string): Promise<User | null> {
	const [user] = await db('system', (tx) => tx<User[]>`
		select u.id, u.email, u.name, u.phone, u.role
		from sessions s join users u on u.id = s.user_id
		where s.id = ${digest(token)} and s.expires_at > now()`);
	return user ?? null;
}

export async function deleteSession(token: string) {
	await db('system', (tx) => tx`delete from sessions where id = ${digest(token)}`);
}

export async function register(input: { name: string; email: string; phone: string; password: string }) {
	const hash = await hashPassword(input.password);
	try {
		const [user] = await db('system', (tx) => tx<User[]>`
			insert into users (name, email, phone, password_hash)
			values (${input.name}, ${input.email}, ${input.phone}, ${hash})
			returning id, email, name, phone, role`);
		return { user };
	} catch (e) {
		if (isConflict(e, '23505')) return { error: 'email_taken' as const };
		throw e;
	}
}

export async function login(email: string, password: string) {
	return db('system', async (tx) => {
		const [{ count }] = await tx<{ count: number }[]>`
			select count(*)::int from login_attempts
			where email = ${email} and failed_at > now() - make_interval(mins => ${LOCK_MINUTES})`;
		if (count >= MAX_FAILED_LOGINS) return { error: 'too_many_attempts' as const };

		const [row] = await tx<(User & { password_hash: string })[]>`
			select id, email, name, phone, role, password_hash from users where email = ${email}`;
		if (!row || !(await verifyPassword(password, row.password_hash))) {
			await tx`insert into login_attempts (email) values (${email})`;
			return { error: 'bad_login' as const };
		}
		await tx`delete from login_attempts where email = ${email}`;
		const { password_hash: _, ...user } = row;
		return { user };
	});
}

/** Emails a reset link if the address has an account; says nothing either way to the caller. */
export async function requestPasswordReset(email: string, origin: string) {
	const token = newToken();
	const [user] = await db('system', async (tx) => {
		const found = await tx<{ id: string; email: string }[]>`select id, email from users where email = ${email}`;
		if (found[0]) {
			await tx`insert into password_resets (id, user_id, expires_at)
				values (${digest(token)}, ${found[0].id}, now() + make_interval(mins => ${RESET_MINUTES}))`;
		}
		return found;
	});
	if (!user) return;
	await sendMail(
		user.email,
		'Reset your password',
		`Open this link to choose a new password. It works for ${RESET_MINUTES} minutes.\n\n${origin}/reset-password/${token}\n\nIf you didn't ask for this, ignore this email.`
	);
}

/** Sets the new password and signs the account out everywhere. False when the link is used or expired. */
export async function resetPassword(token: string, password: string) {
	const hash = await hashPassword(password);
	return db('system', async (tx) => {
		const [reset] = await tx<{ user_id: string }[]>`
			delete from password_resets where id = ${digest(token)} and expires_at > now() returning user_id`;
		if (!reset) return false;
		await tx`update users set password_hash = ${hash} where id = ${reset.user_id}`;
		await tx`delete from sessions where user_id = ${reset.user_id}`;
		return true;
	});
}

/** Signs the browser in: a new session, kept in an httpOnly cookie. */
export async function startSession(cookies: import('@sveltejs/kit').Cookies, userId: string) {
	const { token, expires } = await createSession(userId);
	cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', expires });
}

/** Where to go after signing in: the page they came for if it's one of ours, else their dashboard. */
export function afterLogin(next: string | null, role: Role) {
	if (next && next.startsWith('/') && !next.startsWith('//')) return next;
	return role === 'admin' ? '/admin' : '/portal';
}
