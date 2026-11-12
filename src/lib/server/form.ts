import { fail } from '@sveltejs/kit';
import * as v from 'valibot';

/** A ticked checkbox sends "on"; an unticked one sends nothing. */
export const checkbox = v.pipe(v.optional(v.string()), v.transform((value) => Boolean(value)));
export const text = (max = 200) => v.pipe(v.string(), v.trim(), v.maxLength(max, `Keep this under ${max} characters`));
export const requiredText = (max = 200) => v.pipe(text(max), v.minLength(1, 'This is required'));
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const id = v.pipe(v.string(), v.regex(UUID, 'Choose one from the list'));
/** A row's id when editing; empty (null) when adding a new one. */
export const optionalId = v.pipe(
	v.optional(v.string(), ''),
	v.check((s) => s === '' || UUID.test(s), 'This item no longer exists'),
	v.transform((s) => s || null)
);
export const wholeNumber = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^\d+$/, 'Enter a whole number'),
	v.toNumber(),
	v.maxValue(10_000_000, 'That number is too large')
);
/** A whole number, or empty for "none" (null). */
export const optionalNumber = v.pipe(
	v.optional(v.string(), ''),
	v.trim(),
	v.check((s) => s === '' || /^\d{1,8}$/.test(s), 'Enter a whole number, or leave it empty'),
	v.transform((s) => (s === '' ? null : Number(s)))
);
export const slug = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes, like english-for-beginners'),
	v.maxLength(80)
);
export const httpsUrl = v.pipe(v.string(), v.trim(), v.url('Enter a full link starting with https://'), v.startsWith('https://', 'Enter a full link starting with https://'));

/**
 * Validates a submitted form. On failure, `invalid` is the response to return: each field's first
 * problem, plus the text they typed so the form isn't emptied.
 */
export async function parseForm<S extends v.GenericSchema>(schema: S, request: Request | FormData) {
	const formData = request instanceof FormData ? request : await request.formData();
	const raw = Object.fromEntries(formData);
	const result = v.safeParse(schema, raw);
	if (result.success) return { data: result.output, formData };

	const nested = v.flatten(result.issues).nested ?? {};
	const errors: Record<string, string> = {};
	for (const [field, messages] of Object.entries(nested)) if (messages?.[0]) errors[field.split('.')[0]] = messages[0];
	const values: Record<string, string> = {};
	for (const [k, val] of Object.entries(raw)) if (typeof val === 'string' && !k.includes('password')) values[k] = val;
	return { invalid: fail(400, { errors, values }) };
}
