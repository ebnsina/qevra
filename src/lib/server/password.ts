import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
	const salt = randomBytes(16);
	const key = await derive(password, salt, 64);
	return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string) {
	const [scheme, salt, key] = stored.split('$');
	if (scheme !== 'scrypt' || !salt || !key) return false;
	const expected = Buffer.from(key, 'base64url');
	const actual = await derive(password, Buffer.from(salt, 'base64url'), expected.length);
	return timingSafeEqual(actual, expected);
}
