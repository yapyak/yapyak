import { describe, expect, it } from 'vitest';

import { isLocaleFile, toLocaleCode } from './file';

describe('isLocaleFile', () => {
  it('returns true for a file in the locales directory', () => {
    expect(
      isLocaleFile('/project', 'locales', '/project/locales/de.json'),
    ).toBe(true);
  });

  it('returns false for a file outside the locales directory', () => {
    expect(isLocaleFile('/project', 'locales', '/project/src/a.json')).toBe(
      false,
    );
  });

  it('returns false for a non-JSON file in the locales directory', () => {
    expect(
      isLocaleFile('/project', 'locales', '/project/locales/readme.md'),
    ).toBe(false);
  });
});

describe('toLocaleCode', () => {
  it('returns the locale code', () => {
    expect(toLocaleCode('/project/locales/pt-BR.json')).toBe('pt-BR');
  });
});
