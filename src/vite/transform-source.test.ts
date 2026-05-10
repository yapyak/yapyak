import { describe, expect, it } from 'vitest';
import { type LocaleData, transformSource } from './transform-source.js';

const SOURCE = `
import { defineTranslations } from 'yapyak/react';

const t = defineTranslations({
  greeting: 'Hello {name}',
  cta: 'Open inbox',
});

export function Component() {
  return null;
}
`;

const LOCALE_DATA: LocaleData = {
  en: {
    'src/component.tsx': {
      cta: 'Open inbox',
      greeting: 'Hello {name}',
    },
  },
  sv: {
    'src/component.tsx': {
      cta: 'Öppna inkorgen',
      greeting: 'Hej {name}',
    },
  },
};

describe('transformSource', () => {
  it('returns null when defineTranslations is not imported', () => {
    const code = `
      const t = { hello: 'world' };
    `;
    expect(
      transformSource(code, {
        defaultLocale: 'en',
        fileId: 'src/x.tsx',
        localeData: {},
        locales: ['en'],
      }),
    ).toBeNull();
  });

  it('returns null when no defineTranslations call sites are found', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      // no call
    `;
    expect(
      transformSource(code, {
        defaultLocale: 'en',
        fileId: 'src/x.tsx',
        localeData: {},
        locales: ['en'],
      }),
    ).toBeNull();
  });

  it('replaces defineTranslations call with withLocale call', () => {
    const result = transformSource(SOURCE, {
      defaultLocale: 'en',
      fileId: 'src/component.tsx',
      localeData: LOCALE_DATA,
      locales: ['en', 'sv'],
    });
    expect(result).not.toBeNull();
    expect(result?.code).toContain('__yapyak_withLocale');
    expect(result?.code).not.toContain('defineTranslations({');
  });

  it('injects helper import at the top of the file', () => {
    const result = transformSource(SOURCE, {
      defaultLocale: 'en',
      fileId: 'src/component.tsx',
      localeData: LOCALE_DATA,
      locales: ['en', 'sv'],
    });
    expect(result?.code.startsWith('import { withLocale as __yapyak_withLocale }'))
      .toBe(true);
  });

  it('emits per-locale variants for each schema key', () => {
    const result = transformSource(SOURCE, {
      defaultLocale: 'en',
      fileId: 'src/component.tsx',
      localeData: LOCALE_DATA,
      locales: ['en', 'sv'],
    });
    expect(result?.code).toContain('"Hej {name}"');
    expect(result?.code).toContain('"Öppna inkorgen"');
    expect(result?.code).toContain('"Hello {name}"');
    expect(result?.code).toContain('"Open inbox"');
  });

  it('falls back to source string when locale value is missing', () => {
    const data: LocaleData = {
      en: {
        'src/component.tsx': {
          cta: 'Open inbox',
          greeting: 'Hello {name}',
        },
      },
      sv: {
        'src/component.tsx': {
          cta: 'Öppna inkorgen',
        },
      },
    };
    const result = transformSource(SOURCE, {
      defaultLocale: 'en',
      fileId: 'src/component.tsx',
      localeData: data,
      locales: ['en', 'sv'],
    });
    expect(result?.code).toContain('sv: "Hello {name}"');
  });

  it('falls back to source string when entire locale file is missing', () => {
    const result = transformSource(SOURCE, {
      defaultLocale: 'en',
      fileId: 'src/component.tsx',
      localeData: { en: LOCALE_DATA.en! },
      locales: ['en', 'sv'],
    });
    expect(result?.code).toContain('sv: "Open inbox"');
  });

  it('respects renamed imports', () => {
    const code = `
      import { defineTranslations as dt } from 'yapyak/react';
      const t = dt({ cta: 'Open inbox' });
    `;
    const result = transformSource(code, {
      defaultLocale: 'en',
      fileId: 'src/x.tsx',
      localeData: { en: { 'src/x.tsx': { cta: 'Open inbox' } } },
      locales: ['en'],
    });
    expect(result?.code).toContain('__yapyak_withLocale');
  });

  it('handles multiple defineTranslations calls in one file', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const a = defineTranslations({ x: 'X' });
      const b = defineTranslations({ y: 'Y' });
    `;
    const result = transformSource(code, {
      defaultLocale: 'en',
      fileId: 'src/x.tsx',
      localeData: { en: { 'src/x.tsx': { x: 'X', y: 'Y' } } },
      locales: ['en'],
    });
    expect((result?.code.match(/__yapyak_withLocale\(/g) ?? []).length).toBe(2);
  });

  it('uses custom helper import path when provided', () => {
    const result = transformSource(SOURCE, {
      defaultLocale: 'en',
      fileId: 'src/component.tsx',
      helperImport: 'yapyak/react/with-locale',
      localeData: LOCALE_DATA,
      locales: ['en', 'sv'],
    });
    expect(result?.code).toContain("from 'yapyak/react/with-locale'");
  });

  it('escapes special characters in string values', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const t = defineTranslations({
        msg: 'Hello "world"',
      });
    `;
    const result = transformSource(code, {
      defaultLocale: 'en',
      fileId: 'src/x.tsx',
      localeData: { en: { 'src/x.tsx': { msg: 'Hello "world"' } } },
      locales: ['en'],
    });
    expect(result?.code).toContain('"Hello \\"world\\""');
  });

  it('returns null when schema has unsupported value types', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const dynamic = 'foo';
      const t = defineTranslations({ msg: dynamic });
    `;
    const result = transformSource(code, {
      defaultLocale: 'en',
      fileId: 'src/x.tsx',
      localeData: {},
      locales: ['en'],
    });
    expect(result).toBeNull();
  });

  it('treats empty-string locale values as missing', () => {
    const data: LocaleData = {
      en: {
        'src/component.tsx': {
          cta: 'Open inbox',
          greeting: 'Hello {name}',
        },
      },
      sv: {
        'src/component.tsx': {
          cta: '',
          greeting: 'Hej {name}',
        },
      },
    };
    const result = transformSource(SOURCE, {
      defaultLocale: 'en',
      fileId: 'src/component.tsx',
      localeData: data,
      locales: ['en', 'sv'],
    });
    expect(result?.code).toContain('sv: "Open inbox"');
  });
});
