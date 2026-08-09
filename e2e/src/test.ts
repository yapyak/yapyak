import { test as base, expect } from '@playwright/test';

export type ExampleOptions = {
  allowHydrationMismatch: boolean;
  catalogFileId: string;
  catalogPath: string;
  persistence: 'cookie' | 'local-storage' | 'url';
  sourceAnchor: string;
  sourceInsertion: string;
  sourcePath: string;
  ssrHtml: boolean;
  switchLocaleOnServer: boolean;
};

const IS_PROD = process.env.YAPYAK_E2E_MODE === 'prod';

const HYDRATION_MISMATCH_PREFIX = 'Hydration failed';

export const test = base.extend<ExampleOptions>({
  allowHydrationMismatch: [
    false,
    {
      option: true,
    },
  ],
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
  page: async ({ allowHydrationMismatch, page }, use) => {
    const errors: string[] = [];
    const record = (text: string): void => {
      if (
        allowHydrationMismatch &&
        text.startsWith(HYDRATION_MISMATCH_PREFIX)
      ) {
        return;
      }
      errors.push(text);
    };
    page.on('pageerror', (error) => {
      record(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        record(message.text());
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

export { expect };
