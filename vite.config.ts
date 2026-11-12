import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
			},
			// Singapore: next to the Neon database (aws-ap-southeast-1), so queries don't cross the world.
			adapter: adapter({ runtime: 'nodejs24.x', regions: ['sin1'] })
		})
	],
	test: {
		include: ['src/**/*.test.ts', 'tests/db/**/*.test.ts'],
		// The database tests share one test database: empty it once, then run files one at a time.
		globalSetup: ['tests/db/global-setup.ts'],
		fileParallelism: false
	}
});
