// Applies migrations/*.sql as the owner role, and creates the restricted role the app runs as.
// Usage: node --env-file=.env scripts/migrate.ts
import { readdir, readFile } from 'node:fs/promises';
import postgres from 'postgres';

const dir = new URL('../migrations/', import.meta.url);

export async function migrate(ownerUrl: string, appUrl: string) {
	const app = new URL(appUrl);
	const role = decodeURIComponent(app.username);
	const password = decodeURIComponent(app.password);
	if (!role || !password) throw new Error('DATABASE_APP_URL needs a user and a password');

	const sql = postgres(ownerUrl, { max: 1, onnotice: () => {} });
	try {
		// The app role is made here in SQL: a role made in the Neon console could bypass row-level security.
		const [{ exists }] = await sql`select exists (select 1 from pg_roles where rolname = ${role})`;
		const verb = exists ? 'alter' : 'create';
		const [{ ddl }] = await sql`
			select format('%s role %I login nobypassrls password %L', ${verb}::text, ${role}::text, ${password}::text) as ddl`;
		await sql.unsafe(ddl);

		await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
		const done = new Set((await sql`select name from schema_migrations`).map((r) => r.name));
		for (const name of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
			if (done.has(name)) continue;
			const text = await readFile(new URL(name, dir), 'utf8');
			await sql.begin(async (tx) => {
				await tx.unsafe(text);
				await tx`insert into schema_migrations (name) values (${name})`;
			});
			console.log(`applied ${name}`);
		}

		await sql`grant usage on schema public to ${sql(role)}`;
		await sql`grant select, insert, update, delete on all tables in schema public to ${sql(role)}`;
		await sql`revoke all on schema_migrations from ${sql(role)}`;
	} finally {
		await sql.end();
	}
}

function required(name: string) {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

if (process.argv[1] === import.meta.filename) {
	// Neon also gives a direct (unpooled) address; schema changes go over that one when it is there.
	await migrate(process.env.DATABASE_URL_UNPOOLED || required('DATABASE_URL'), required('DATABASE_APP_URL'));
	console.log('database is up to date');
}
