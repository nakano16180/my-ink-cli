import {defineConfig, devices} from '@playwright/test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const playgroundUrl = 'http://127.0.0.1:4173';

export default defineConfig({
	testDir: './tests',
	timeout: 180_000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', {open: 'never'}], ['list']],
	use: {
		baseURL: playgroundUrl,
		trace: 'on-first-retry',
		launchOptions: {
			args: [
				'--no-sandbox',
				'--disable-dev-shm-usage',
			],
		},
	},
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
		cwd: projectRoot,
		url: playgroundUrl,
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{
			name: 'chromium',
			use: {...devices['Desktop Chrome']},
		},
	],
});
