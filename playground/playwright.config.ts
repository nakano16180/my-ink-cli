import {defineConfig, devices} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', {open: 'never'}], ['list']],
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'on-first-retry',
		launchOptions: {
			args: [
				'--no-sandbox',            // WSL2では必須
        '--disable-gpu',           // 安定性向上
        '--disable-dev-shm-usage', // コンテナ内でのクラッシュ回避
			]
		}
	},
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4173',
		cwd: projectRoot,
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{
			name: 'chromium',
			use: {...devices['Desktop Chrome']},
		},
	],
});
