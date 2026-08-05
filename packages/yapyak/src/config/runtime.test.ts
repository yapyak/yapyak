import { describe, expect, it } from 'vitest';

import { defineRuntime } from './runtime';

const baseInput = {
  defaultLocale: 'en',
  detectUserLocale: false,
  locales: [
    'en',
    'sv',
  ],
  syncHtmlLang: false,
};

describe('defineRuntime', () => {
  it('emits every constant as a JS `export const` line', () => {
    const code = defineRuntime({
      ...baseInput,
      persistence: {
        type: 'none',
      },
    });
    expect(code).toContain('export const LOCALES = ["en","sv"];');
    expect(code).toContain('export const DEFAULT_LOCALE = "en";');
    expect(code).toContain('export const DETECT_USER_LOCALE = false;');
    expect(code).toContain('export const SYNC_HTML_LANG = false;');
  });

  it('emits a `none` persistence config with bare type', () => {
    const code = defineRuntime({
      ...baseInput,
      persistence: {
        type: 'none',
      },
    });
    expect(code).toContain(`PERSISTENCE_CONFIG = { type: 'none' };`);
  });

  it('emits a `cookie` persistence config with the cookie name', () => {
    const code = defineRuntime({
      ...baseInput,
      persistence: {
        name: 'locale',
        secure: false,
        type: 'cookie',
      },
    });
    expect(code).toContain(
      `PERSISTENCE_CONFIG = { type: 'cookie', name: "locale", secure: false };`,
    );
  });

  it('emits a `cookie` persistence config with `secure: true` when requested', () => {
    const code = defineRuntime({
      ...baseInput,
      persistence: {
        name: 'locale',
        secure: true,
        type: 'cookie',
      },
    });
    expect(code).toContain(
      `PERSISTENCE_CONFIG = { type: 'cookie', name: "locale", secure: true };`,
    );
  });

  it('emits a `local-storage` persistence config with the storage key', () => {
    const code = defineRuntime({
      ...baseInput,
      persistence: {
        key: 'locale',
        type: 'local-storage',
      },
    });
    expect(code).toContain(
      `PERSISTENCE_CONFIG = { type: 'local-storage', key: "locale" };`,
    );
  });

  it('emits a `url` persistence config without `match` when none is given', () => {
    const code = defineRuntime({
      ...baseInput,
      persistence: {
        type: 'url',
      },
    });
    expect(code).toContain(`PERSISTENCE_CONFIG = { type: 'url' };`);
  });

  it('emits a `url` persistence config with a `RegExp` matcher when `match` is given', () => {
    const code = defineRuntime({
      ...baseInput,
      persistence: {
        match: /^\/(?<locale>[a-z]{2})\//,
        type: 'url',
      },
    });
    expect(code).toContain(
      `PERSISTENCE_CONFIG = { type: 'url', match: new RegExp(`,
    );
  });
});
