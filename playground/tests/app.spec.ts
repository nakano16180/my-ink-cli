import {expect, test} from '@playwright/test';

test('playground shell UI is rendered', async ({page}) => {
	await page.goto('/');

	await expect(
		page.getByRole('heading', {name: 'WebContainer Ink playground'}),
	).toBeVisible();
	await expect(page.locator('main.app > .terminal')).toBeVisible();

	const status = page.locator('header p');
	await expect(status).toBeVisible();
	await expect(status).not.toHaveText('');
});
