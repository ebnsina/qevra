import postgres from 'postgres';
import { DATABASE_APP_URL } from '$app/env/private';

// prepare: false because Neon's pooled connections don't keep prepared statements.
const sql = postgres(DATABASE_APP_URL, { prepare: false, max: 5, idle_timeout: 20 });

export type Tx = postgres.TransactionSql;
export type Role = 'admin' | 'student';
/** Who a query runs as. 'system' is for sign-in and bookkeeping no person may do directly. */
export type Actor = { id: string; role: Role } | 'system' | 'anon';

/** Runs `fn` in one transaction as `actor`; the database's row-level security reads these settings. */
export function db<T>(actor: Actor, fn: (tx: Tx) => Promise<T>): Promise<T> {
	const [id, role] = typeof actor === 'string' ? ['', actor] : [actor.id, actor.role];
	return sql.begin(async (tx) => {
		// Started but not awaited, so it travels with fn's first query instead of costing its own trip.
		const actorSet = tx`select set_config('app.user_id', ${id}, true), set_config('app.role', ${role}, true)`.execute();
		const [result] = await Promise.all([fn(tx), actorSet]);
		return result;
	}) as Promise<T>;
}

/** True for a unique-key clash (23505) or a row still in use elsewhere (23503). */
export function isConflict(e: unknown, code: '23505' | '23503') {
	return e instanceof postgres.PostgresError && e.code === code;
}
