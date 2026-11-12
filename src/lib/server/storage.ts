import { randomUUID } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import { AWS_ACCESS_KEY_ID, AWS_ENDPOINT_URL_S3, AWS_REGION, AWS_SECRET_ACCESS_KEY } from '$app/env/private';

/** The one bucket for uploads; declared in neon.ts, which creates it on Neon. */
export const BUCKET = 'files';

// shortcut: files pass through the app, and Vercel rejects request bodies over 4.5 MB;
// switch to browser-to-bucket presigned uploads when larger files are needed.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const IMAGE_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const DOCUMENT_TYPES = {
	...IMAGE_TYPES,
	pdf: 'application/pdf',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
const ALLOWED = { image: IMAGE_TYPES, document: DOCUMENT_TYPES } as const;
export type FileKind = keyof typeof ALLOWED;

const client = new AwsClient({
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY,
	region: AWS_REGION,
	service: 's3'
});

const extension = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
const objectUrl = (key: string) =>
	`${AWS_ENDPOINT_URL_S3}/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;

/** The content type we serve a stored file with; decided by us, never by the uploader. */
export function contentType(key: string) {
	return (DOCUMENT_TYPES as Record<string, string>)[extension(key)] ?? 'application/octet-stream';
}

/** A form's file field, or null when nothing was chosen. */
export function chosenFile(value: FormDataEntryValue | null) {
	return value instanceof File && value.size > 0 ? value : null;
}

export async function saveUpload(file: File, prefix: string, kind: FileKind) {
	const ext = extension(file.name);
	if (!(ext in ALLOWED[kind])) return { error: kind === 'image' ? ('file_not_image' as const) : ('file_type' as const) };
	if (file.size > MAX_UPLOAD_BYTES) return { error: 'file_too_large' as const };

	const key = `${prefix}/${randomUUID()}.${ext}`;
	const res = await client.fetch(objectUrl(key), {
		method: 'PUT',
		body: await file.arrayBuffer(),
		headers: { 'content-type': contentType(key) }
	});
	if (!res.ok) throw new Error(`storage: saving ${key} failed with ${res.status}`);
	return { key, name: file.name };
}

/** The stored file's response from the bucket, or null when it doesn't exist. */
export async function readFile(key: string) {
	const res = await client.fetch(objectUrl(key));
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`storage: reading ${key} failed with ${res.status}`);
	return res;
}

export async function deleteFile(key: string) {
	const res = await client.fetch(objectUrl(key), { method: 'DELETE' });
	if (!res.ok && res.status !== 404) throw new Error(`storage: deleting ${key} failed with ${res.status}`);
}
