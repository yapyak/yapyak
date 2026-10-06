import { describe, expect, it } from 'vitest';
import { findTranslation } from 'yapyak/compiler/internal';

import { buildTranslationTable } from './table';

const COMPILER = {
  findTranslation,
};

describe('buildTranslationTable', () => {
  it('builds a row for every target locale', () => {
    expect(
      buildTranslationTable(COMPILER, {
        fileId: 'src/a.tsx',
        localeData: {
          sv: {
            'src/a.tsx': {
              'Save changes': 'Spara ändringar',
            },
          },
        },
        locales: [
          'en',
          'sv',
        ],
        source: 'Save changes',
        sourceLocale: 'en',
      }),
    ).toEqual([
      {
        locale: 'sv',
        value: 'Spara ändringar',
      },
    ]);
  });

  it('builds a row without a value when the entry is missing', () => {
    expect(
      buildTranslationTable(COMPILER, {
        fileId: 'src/a.tsx',
        localeData: {
          sv: {},
        },
        locales: [
          'en',
          'sv',
        ],
        source: 'Save changes',
        sourceLocale: 'en',
      }),
    ).toEqual([
      {
        locale: 'sv',
      },
    ]);
  });

  it('builds a row without a value when the entry is an empty stub', () => {
    expect(
      buildTranslationTable(COMPILER, {
        fileId: 'src/a.tsx',
        localeData: {
          sv: {
            'src/a.tsx': {
              'Save changes': '',
            },
          },
        },
        locales: [
          'en',
          'sv',
        ],
        source: 'Save changes',
        sourceLocale: 'en',
      }),
    ).toEqual([
      {
        locale: 'sv',
      },
    ]);
  });

  it('builds a row for a homonym context', () => {
    expect(
      buildTranslationTable(COMPILER, {
        context: 'button',
        fileId: 'src/a.tsx',
        localeData: {
          sv: {
            'src/a.tsx': {
              Open: {
                button: 'Öppna',
              },
            },
          },
        },
        locales: [
          'en',
          'sv',
        ],
        source: 'Open',
        sourceLocale: 'en',
      }),
    ).toEqual([
      {
        locale: 'sv',
        value: 'Öppna',
      },
    ]);
  });

  it('builds no rows when `locales` holds the default locale only', () => {
    expect(
      buildTranslationTable(COMPILER, {
        fileId: 'src/a.tsx',
        localeData: {},
        locales: [
          'en',
        ],
        source: 'Save changes',
        sourceLocale: 'en',
      }),
    ).toEqual([]);
  });
});
