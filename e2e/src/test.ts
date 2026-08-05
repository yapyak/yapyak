import { test as base, expect } from '@playwright/test';

export type ExampleOptions = {
  persistence: 'cookie' | 'local-storage' | 'url';
  switchLocaleOnServer: boolean;
};

const IS_PROD = process.env.YAPYAK_E2E_MODE === 'prod';

export const test = base.extend<ExampleOptions>({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
        return;
      }
      if (IS_PROD && message.text().includes('[yapyak]')) {
        errors.push(message.text());
      }
    });
    await use(page);
    expect(errors).toEqual([]);
  },
  persistence: [
    'local-storage',
    {
      option: true,
    },
  ],
  switchLocaleOnServer: [
    false,
    {
      option: true,
    },
  ],
});

export { expect };
