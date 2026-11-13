// Puts a file in the storage bucket. Shared by the seed scripts.
import { AwsClient } from 'aws4fetch';

const env = (name: string) => {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
};
const TYPES: Record<string, string> = { webp: 'image/webp', pdf: 'application/pdf' };
let client: AwsClient | undefined;

export async function upload(key: string, body: string | Uint8Array<ArrayBuffer>) {
	const type = TYPES[key.split('.').pop()!];
	if (!type) throw new Error(`no content type known for ${key}`);
	client ??= new AwsClient({
		accessKeyId: env('AWS_ACCESS_KEY_ID'),
		secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
		region: env('AWS_REGION'),
		service: 's3'
	});
	const res = await client.fetch(`${env('AWS_ENDPOINT_URL_S3')}/files/${key}`, { method: 'PUT', body, headers: { 'content-type': type } });
	if (!res.ok) throw new Error(`uploading ${key} failed with ${res.status}`);
}
