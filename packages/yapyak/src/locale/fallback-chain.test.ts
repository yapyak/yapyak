import { describe, expect, it } from 'vitest';

import { getLocaleFallbackChain } from './fallback-chain';

describe('getLocaleFallbackChain', () => {
  it('returns just the input for a bare language tag', () => {
    expect(getLocaleFallbackChain('en')).toEqual([
      'en',
    ]);
  });

  it('truncates the region subtag to fall through to the bare language', () => {
    expect(getLocaleFallbackChain('sv-FI')).toEqual([
      'sv-FI',
      'sv',
    ]);
  });

  it('truncates script and region subtags step by step', () => {
    expect(getLocaleFallbackChain('zh-Hant-TW')).toEqual([
      'zh-Hant-TW',
      'zh-Hant',
      'zh',
    ]);
  });

  it('preserves casing — does not canonicalize the input', () => {
    expect(getLocaleFallbackChain('PT-br')).toEqual([
      'PT-br',
      'PT',
    ]);
  });
});
