import { DEFAULT_HOME, DEFAULT_SETTINGS, type Home, type Settings } from '#lib/content.ts';
import type { Tx } from './db.ts';

/** Saved content over the defaults, so a field added later still has a value. */
export async function getContent(tx: Tx): Promise<{ settings: Settings; home: Home }> {
	const rows = await tx<{ key: string; value: object }[]>`select key, value from site_content`;
	const saved = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return {
		settings: { ...DEFAULT_SETTINGS, ...saved.settings },
		home: { ...DEFAULT_HOME, ...saved.home }
	};
}
