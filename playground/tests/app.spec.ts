import {expect, type Page, test} from '@playwright/test';

const terminal = (page: Page) => page.locator('.xterm');

const expectTerminalText = async (page: Page, text: string | RegExp) => {
	await expect(terminal(page)).toContainText(text, {timeout: 180_000});
};

test('starts the WebContainer shell', async ({page}) => {
	await page.goto('/');

	await expect(
		page.getByRole('heading', {name: 'WebContainer Ink playground'}),
	).toBeVisible();
	await expect(page.locator('main.app > .terminal')).toBeVisible();

	const status = page.locator('header p');
	await expect(status).toHaveText('Shell ready. Type: node ink-cli.mjs', {
		timeout: 180_000,
	});
	await expectTerminalText(page, 'Shell ready. Type: node ink-cli.mjs');
});

test('runs the sample Ink CLI in the browser shell', async ({page}) => {
	await page.goto('/');

	await expect(page.locator('header p')).toHaveText(
		'Shell ready. Type: node ink-cli.mjs',
		{timeout: 180_000},
	);

	await terminal(page).click();
	await page.keyboard.type('node ink-cli.mjs');
	await page.keyboard.press('Enter');

	await expectTerminalText(page, 'WebContainer Ink interactive menu');

	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');

	await expectTerminalText(page, 'Selected: React');
});
