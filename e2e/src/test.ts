import type { Page } from '@playwright/test';

import { test as base, expect } from '@playwright/test';

export type ExampleOptions = {
  catalogFileId: string;
  catalogPath: string;
  persistence: 'cookie' | 'local-storage' | 'url';
  sourceAnchor: string;
  sourceInsertion: string;
  sourcePath: string;
  ssrHtml: boolean;
  switchLocaleOnServer: boolean;
};

export const test = base.extend<ExampleOptions>({
  catalogFileId: [
    '',
    {
      option: true,
    },
  ],
  catalogPath: [
    '',
    {
      option: true,
    },
  ],
  page: async ({ page }, use) => {
    const errors = collectErrors(page);
    await use(page);
    expect(errors).toEqual([]);
  },
  persistence: [
    'local-storage',
    {
      option: true,
    },
  ],
  sourceAnchor: [
    '',
    {
      option: true,
    },
  ],
  sourceInsertion: [
    '',
    {
      option: true,
    },
  ],
  sourcePath: [
    '',
    {
      option: true,
    },
  ],
  ssrHtml: [
    false,
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

const IS_PROD = process.env.YAPYAK_E2E_MODE === 'prod';

export function collectErrors(page: Page): string[] {
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
  return errors;
}

export { expect };
