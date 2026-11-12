// Creates a staff account (or makes an existing account staff) with a new random password,
// which is shown once here. Sign in, then change it under Profile.
//
//   node --env-file=.env scripts/create-admin.ts you@example.com "Your Name"
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import { hashPassword } from '../src/lib/server/password.ts';

const [email, name] = process.argv.slice(2);
if (!email?.includes('@') || !name) {
	console.error('Usage: node --env-file=.env scripts/create-admin.ts <email> "<name>"');
	process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const password = randomBytes(12).toString('base64url');
const sql = postgres(url, { max: 1, onnotice: () => {} });
await sql`
	insert into users (email, name, role, password_hash)
	values (${email}, ${name}, 'admin', ${await hashPassword(password)})
	on conflict (email) do update set role = 'admin', password_hash = excluded.password_hash`;
// Any older sign-ins for this account end now.
await sql`delete from sessions where user_id = (select id from users where email = ${email})`;
await sql.end();

console.log(`Admin ready: ${email}`);
console.log(`Password (shown once): ${password}`);
