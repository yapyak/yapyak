import { describe, expect, it } from 'vitest';

import { stripBom } from './bom';

describe('stripBom', () => {
  it('strips the BOM when the content starts with one', () => {
    expect(stripBom('\ufeffHello')).toBe('Hello');
  });

  it('preserves the content when no BOM is present', () => {
    expect(stripBom('Hello')).toBe('Hello');
  });

  it('preserves the content when it is empty', () => {
    expect(stripBom('')).toBe('');
  });
});
