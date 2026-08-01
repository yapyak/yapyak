import { test as base, expect } from '@playwright/test';

export type ExampleOptions = {
  persistence: 'cookie' | 'local-storage' | 'url';
  switchLocaleOnServer: boolean;
};

export const test = base.extend<ExampleOptions>({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
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
