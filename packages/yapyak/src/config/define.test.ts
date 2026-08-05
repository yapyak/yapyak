import { describe, expect, it } from 'vitest';

import { defineConfig } from './define';

describe('defineConfig', () => {
  it('returns the config unchanged', () => {
    const config = {
      defaultLocale: 'sv',
      localesDir: 'locales',
    };
    expect(defineConfig(config)).toBe(config);
  });
});
