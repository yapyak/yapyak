import type { Locator, Page } from '@playwright/test';

import { expect, test } from './test';

const CONTENT: Record<
  'en' | 'sv',
  {
    heading: string;
    strongs: string[];
    texts: {
      count: number;
      text: string;
    }[];
  }
> = {
  en: {
    heading: 'Hello there',
    strongs: [
      'everything',
      'line breaks',
    ],
    texts: [
      {
        count: 2,
        text: 'Hello there',
      },
      {
        count: 1,
        text: 'Hej där',
      },
      {
        count: 2,
        text: 'Open',
      },
      {
        count: 1,
        text: 'This is the yapyak example.',
      },
      {
        count: 1,
        text: 'You have 3 messages',
      },
      {
        count: 1,
        text: 'You have 1 message',
      },
      {
        count: 1,
        text: 'Total: 42%',
      },
      {
        count: 1,
        text: 'Price: €99.50',
      },
      {
        count: 1,
        text: 'Count: 43',
      },
      {
        count: 1,
        text: 'Updated: January 1, 2024',
      },
      {
        count: 1,
        text: 'Updated: 1/1/24',
      },
      {
        count: 1,
        text: 'At: 9:30 AM',
      },
      {
        count: 1,
        text: 'Editor',
      },
      {
        count: 1,
        text: 'apple, pear, and banana',
      },
      {
        count: 1,
        text: '2 days ago',
      },
      {
        count: 1,
        text: 'in 3 hours',
      },
    ],
  },
  sv: {
    heading: 'Hej där',
    strongs: [
      'allt',
      'radbrytningar',
    ],
    texts: [
      {
        count: 2,
        text: 'Hej där',
      },
      {
        count: 1,
        text: 'Hello there',
      },
      {
        count: 1,
        text: 'Öppna',
      },
      {
        count: 1,
        text: 'Öppen',
      },
      {
        count: 1,
        text: 'Detta är yapyak-exemplet.',
      },
      {
        count: 1,
        text: 'Du har 3 meddelanden',
      },
      {
        count: 1,
        text: 'Du har 1 meddelande',
      },
      {
        count: 1,
        text: 'Totalt: 42 %',
      },
      {
        count: 1,
        text: 'Pris: 99,50 €',
      },
      {
        count: 1,
        text: 'Antal: 43',
      },
      {
        count: 1,
        text: 'Uppdaterad: 1 januari 2024',
      },
      {
        count: 1,
        text: 'Uppdaterad: 2024-01-01',
      },
      {
        count: 1,
        text: 'Klockan: 09:30',
      },
      {
        count: 1,
        text: 'Redaktör',
      },
      {
        count: 1,
        text: 'äpple, päron och banan',
      },
      {
        count: 1,
        text: 'för 2 dagar sedan',
      },
      {
        count: 1,
        text: 'om 3 timmar',
      },
    ],
  },
};

test('renders English content for the default locale', async ({ page }) => {
  await page.goto('/');

  await validateContent(page, 'en');
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

  await validateContent(page, 'sv');
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
  switchLocaleOnServer,
}) => {
  test.skip(!switchLocaleOnServer);

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
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('renders Swedish content for `/sv`', async ({ page, persistence }) => {
  test.skip(persistence !== 'url');

  await page.goto('/sv');

  await validateContent(page, 'sv');
});

async function validateContent(page: Page, locale: 'en' | 'sv'): Promise<void> {
  const { heading, strongs, texts } = CONTENT[locale];
  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText(heading);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  for (const { count, text } of texts) {
    await expect(
      page.getByText(text, {
        exact: true,
      }),
    ).toHaveCount(count);
  }
  await expect(page.locator('strong')).toHaveText(strongs);
  await expect(
    page.getByRole('link', {
      name: 'yapyak',
    }),
  ).toHaveAttribute('href', 'https://yapyak.dev');
  await expect(page.locator('br')).toHaveCount(1);
}

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
