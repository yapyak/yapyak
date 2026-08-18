import type { ExtractedMessage } from 'yapyak/compiler/internal';

import { describe, expect, it } from 'vitest';
import { findTranslation } from 'yapyak/compiler/internal';

import { buildTranslationStats } from './stat';

const compiler = {
  findTranslation,
};

function makeMessage(source: string, fileId = 'src/a.tsx'): ExtractedMessage {
  return {
    id: source,
    locations: [
      {
        callSiteContext: {},
        fileId,
        range: {
          end: {
            column: 0,
            line: 1,
            offset: 0,
          },
          start: {
            column: 0,
            line: 1,
            offset: 0,
          },
        },
      },
    ],
    placeholders: [],
    source,
  };
}

describe('buildTranslationStats', () => {
  it('builds one stat for every locale but the default', () => {
    expect(
      buildTranslationStats(compiler, {
        defaultLocale: 'en',
        localeData: {},
        locales: [
          'en',
          'de',
          'sv',
        ],
        messages: [],
      }).map((stat) => stat.locale),
    ).toEqual([
      'de',
      'sv',
    ]);
  });

  it('counts a translated message', () => {
    expect(
      buildTranslationStats(compiler, {
        defaultLocale: 'en',
        localeData: {
          sv: {
            'src/a.tsx': {
              Hello: 'Hej',
            },
          },
        },
        locales: [
          'en',
          'sv',
        ],
        messages: [
          makeMessage('Hello'),
        ],
      })[0],
    ).toEqual({
      locale: 'sv',
      missing: 0,
      translated: 1,
    });
  });

  it('counts a message with no entry as missing', () => {
    expect(
      buildTranslationStats(compiler, {
        defaultLocale: 'en',
        localeData: {},
        locales: [
          'en',
          'sv',
        ],
        messages: [
          makeMessage('Hello'),
        ],
      })[0]?.missing,
    ).toBe(1);
  });

  it('counts an empty translation as missing', () => {
    expect(
      buildTranslationStats(compiler, {
        defaultLocale: 'en',
        localeData: {
          sv: {
            'src/a.tsx': {
              Hello: '',
            },
          },
        },
        locales: [
          'en',
          'sv',
        ],
        messages: [
          makeMessage('Hello'),
        ],
      })[0]?.missing,
    ).toBe(1);
  });

  it('counts only the file the input names', () => {
    expect(
      buildTranslationStats(compiler, {
        defaultLocale: 'en',
        fileId: 'src/a.tsx',
        localeData: {},
        locales: [
          'en',
          'sv',
        ],
        messages: [
          makeMessage('Hello'),
          makeMessage('Save', 'src/b.tsx'),
        ],
      })[0]?.missing,
    ).toBe(1);
  });
});
