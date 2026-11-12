import { execFileSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import resetDatabase from '../db/global-setup.ts';

export default async function setup() {
	loadEnvFile('.env.test');
	await resetDatabase();
	execFileSync('node', ['--env-file=.env.test', 'scripts/seed.ts', '--demo'], { stdio: 'inherit' });
}
