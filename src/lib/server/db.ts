import postgres from 'postgres';
import { DATABASE_APP_URL } from '$app/env/private';

// prepare: false because Neon's pooled connections don't keep prepared statements.
const sql = postgres(DATABASE_APP_URL, { prepare: false, max: 5, idle_timeout: 20 });

export type Tx = postgres.TransactionSql;
export type Role = 'admin' | 'student';
/** Who a query runs as. 'system' is for sign-in and bookkeeping no person may do directly. */
export type Actor = { id: string; role: Role } | 'system' | 'anon';

/**
 * Runs `fn` in one transaction as `actor`; the database's row-level security reads these settings.
 * Each trip to the database costs time, so the opening statements are sent without waiting and travel
 * with fn's first query. When fn hands back a single query, the commit goes along too: one trip in all.
 */
export async function db<T>(actor: Actor, fn: (tx: Tx) => Promise<T>): Promise<T> {
	const [id, role] = typeof actor === 'string' ? ['', actor] : [actor.id, actor.role];
	const tx = await sql.reserve();
	let closed: Promise<unknown> | undefined;
	try {
		const begun = tx`begin`.execute();
		const actorSet = tx`select set_config('app.user_id', ${id}, true), set_config('app.role', ${role}, true)`.execute();
		const work = fn(tx as unknown as Tx);
		// A query not yet sent (rather than a promise already running): nothing can follow it, so close now.
		if ('execute' in work && typeof work.execute === 'function') {
			work.execute();
			closed = tx`commit`.execute();
		}
		const [result] = await Promise.all([work, begun, actorSet]);
		await (closed ?? tx`commit`);
		return result;
	} catch (e) {
		// After a failed statement the commit already sent ends the transaction as a rollback.
		await (closed ?? tx`rollback`).catch(() => {});
		throw e;
	} finally {
		tx.release();
	}
}

/** True for a unique-key clash (23505) or a row still in use elsewhere (23503). */
export function isConflict(e: unknown, code: '23505' | '23503') {
	return e instanceof postgres.PostgresError && e.code === code;
}
