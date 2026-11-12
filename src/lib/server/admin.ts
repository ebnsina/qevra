// Shared by the admin screens: save or delete one row, with its uploaded file kept in step.
import { fail } from '@sveltejs/kit';
import { isConflict, type Tx } from './db.ts';
import { UUID } from './form.ts';
import { chosenFile, deleteFile, saveUpload, type FileKind } from './storage.ts';

type Db = App.Locals['db'];
// Table and column names below always come from our own code, never from a request.
type Row = Record<string, string | number | boolean | Date | null | string[]>;

/** Stores the form's chosen file. Null when nothing was chosen; `error` when the file isn't acceptable. */
export async function uploadFrom(formData: FormData, field: string, prefix: string, kind: FileKind) {
	const file = chosenFile(formData.get(field));
	return file ? saveUpload(file, prefix, kind) : null;
}

/**
 * Updates the row with this id, or adds a new one. Returns a failure to hand back to the form when
 * the web address (or another unique value) is taken. `fileColumn` names the column holding an
 * uploaded file's key, so the file it replaces is removed from storage.
 */
export async function saveRow(db: Db, table: string, id: string | null, row: Row, fileColumn?: string) {
	try {
		const replaced = await db(async (tx: Tx) => {
			if (!id) {
				await tx`insert into ${tx(table)} ${tx(row)}`;
				return null;
			}
			const [old] = fileColumn && row[fileColumn] ? await tx`select ${tx(fileColumn)} as key from ${tx(table)} where id = ${id}` : [];
			await tx`update ${tx(table)} set ${tx(row)} where id = ${id}`;
			return (old?.key as string | null) ?? null;
		});
		if (replaced && replaced !== row[fileColumn!]) await deleteFile(replaced);
	} catch (e) {
		if (isConflict(e, '23505')) return fail(409, { code: 'slug_taken' });
		throw e;
	}
}

/** Deletes the row named by the form's `id`, and its uploaded file. Fails politely when students' records depend on it. */
export async function deleteRow(db: Db, table: string, formData: FormData, fileColumn?: string) {
	const id = String(formData.get('id') ?? '');
	if (!UUID.test(id)) return fail(400, { code: 'not_found' });
	try {
		const [gone] = await db((tx: Tx) =>
			fileColumn ? tx`delete from ${tx(table)} where id = ${id} returning ${tx(fileColumn)} as key` : tx`delete from ${tx(table)} where id = ${id} returning null as key`
		);
		if (gone?.key) await deleteFile(gone.key as string);
	} catch (e) {
		if (isConflict(e, '23503')) return fail(409, { code: 'in_use' });
		throw e;
	}
}
