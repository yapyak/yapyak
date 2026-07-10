import type { Locator, Page } from '@playwright/test';

import { expect, test } from './test';

test('renders English content for the default locale', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText('Hello there');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('You have 3 messages')).toBeVisible();
});

test('renders Swedish content when Swedish is clicked', async ({
  page,
  persistence,
}) => {
  await page.goto('/');
  await setSwedishLocale(
    page,
    page
      .getByRole(persistence === 'url' ? 'link' : 'button', {
        name: 'Swedish',
      })
      .first(),
  );

  await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
  await expect(page.getByText('Du har 3 meddelanden')).toBeVisible();
});

test('preserves the locale when the page reloads', async ({
  page,
  persistence,
}) => {
  test.skip(persistence === 'url');

  await page.goto('/');
  await setSwedishLocale(
    page,
    page
      .getByRole('button', {
        name: 'Swedish',
      })
      .first(),
  );
  await page.reload();

  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText('Hej där');
});

test('renders Swedish content when the server switch is clicked', async ({
  page,
  serverSwitch,
}) => {
  test.skip(!serverSwitch);

  await page.goto('/');
  await setSwedishLocale(
    page,
    page
      .getByRole('button', {
        name: 'Swedish',
      })
      .last(),
  );

  await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
});

test('renders Swedish content for `/sv`', async ({ page, persistence }) => {
  test.skip(persistence !== 'url');

  await page.goto('/sv');

  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText('Hej där');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
});

async function setSwedishLocale(page: Page, locator: Locator): Promise<void> {
  await page.waitForLoadState('networkidle');
  await locator.click();
  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText('Hej där', {
    timeout: 15_000,
  });
}
