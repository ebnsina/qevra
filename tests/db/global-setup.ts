// Starts every test run from an empty, migrated test database (the one named in .env.test).
import postgres from 'postgres';
import { migrate } from '../../scripts/migrate.ts';

export default async function setup() {
	const owner = process.env.DATABASE_URL;
	const app = process.env.DATABASE_APP_URL;
	if (!owner || !app) throw new Error('Run tests with `pnpm test`, which loads .env.test');
	if (!new URL(owner).pathname.endsWith('_test')) throw new Error('Refusing to wipe a database whose name does not end in _test');
	const sql = postgres(owner, { max: 1, onnotice: () => {} });
	await sql`drop schema public cascade`;
	await sql`create schema public`;
	await sql.end();
	await migrate(owner, app);
}
