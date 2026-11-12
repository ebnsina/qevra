import { defineConfig } from '@playwright/test';

// Runs the real app against the test database (.env.test), filled with the demo content.
export default defineConfig({
	testDir: 'tests/e2e',
	globalSetup: './tests/e2e/global-setup.ts',
	workers: 1,
	// The dev server compiles each page on its first visit, which is slow the first time through.
	timeout: 120_000,
	expect: { timeout: 20_000 },
	use: { baseURL: 'http://localhost:5174' },
	webServer: {
		command: 'node --env-file=.env.test ./node_modules/vite/bin/vite.js dev --port 5174 --strictPort',
		url: 'http://localhost:5174',
		reuseExistingServer: false
	}
});
