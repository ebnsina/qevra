import type { Tx } from '#lib/server/db.ts';
import type { User } from '#lib/server/auth.ts';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			/** Runs queries as the signed-in person (or as a visitor), under row-level security. */
			db: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
		}
	}
}

export {};
