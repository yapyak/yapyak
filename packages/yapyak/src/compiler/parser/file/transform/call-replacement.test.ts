import { describe, expect, it } from 'vitest';

import { extractFile } from '../extract';
import { renderCallReplacement } from './call-replacement';

function findFirstCallSite(source: string) {
  return extractFile('src/a.tsx', source).callSites[0];
}

describe('renderCallReplacement', () => {
  it('returns undefined when the call-site has an empty source', () => {
    const source = "import { t } from 'yapyak'; t('Hello');";
    const callSite = findFirstCallSite(source);
    if (!callSite) {
      throw new Error('expected a call site');
    }
    const result = renderCallReplacement({
      callSite: {
        ...callSite,
        source: '',
      },
      defaultLocale: 'en',
      locales: [
        'en',
      ],
      localsByFactory: new Map(),
      pickLocal: '_pick',
      registerCatalog: (literal) => literal,
      singleLocale: true,
      translations: {},
    });
    expect(result).toBeUndefined();
  });

  it('elides a static single-locale call to its inline source string', () => {
    const source = "import { t } from 'yapyak'; export const x = t('Hello');";
    const callSite = findFirstCallSite(source);
    if (!callSite) {
      throw new Error('expected a call site');
    }
    const result = renderCallReplacement({
      callSite,
      defaultLocale: 'en',
      locales: [
        'en',
      ],
      localsByFactory: new Map(),
      pickLocal: '_pick',
      registerCatalog: (literal) => literal,
      singleLocale: true,
      translations: {},
    });
    expect(result?.code).toBe("'Hello'");
    expect(result?.usesPick).toBe(false);
  });

  it('elides a placeholder-bearing single-locale call to a template literal', () => {
    const source = [
      "import { t } from 'yapyak';",
      "export const x = t('Hi {name}', { name: 'Alex' });",
    ].join('\n');
    const callSite = findFirstCallSite(source);
    if (!callSite) {
      throw new Error('expected a call site');
    }
    const result = renderCallReplacement({
      callSite,
      defaultLocale: 'en',
      locales: [
        'en',
      ],
      localsByFactory: new Map(),
      pickLocal: '_pick',
      registerCatalog: (literal) => literal,
      singleLocale: true,
      translations: {},
    });
    expect(result?.code).toContain('${');
    expect(result?.code).toContain("'Alex'");
  });

  it('builds a pick invocation for a multi-locale static call', () => {
    const source = "import { t } from 'yapyak'; export const x = t('Save');";
    const callSite = findFirstCallSite(source);
    if (!callSite) {
      throw new Error('expected a call site');
    }
    let registered: string | undefined;
    const result = renderCallReplacement({
      callSite,
      defaultLocale: 'en',
      locales: [
        'en',
        'sv',
      ],
      localsByFactory: new Map(),
      pickLocal: '_pick',
      registerCatalog: (literal, id) => {
        registered = literal;
        return `_catalog_${id}`;
      },
      singleLocale: false,
      translations: {
        sv: {
          [callSite.id]: 'Spara',
        },
      },
    });
    expect(result?.code).toMatch(/^_pick\(/);
    expect(result?.usesPick).toBe(true);
    expect(registered).toContain("'Save'");
    expect(registered).toContain("'Spara'");
  });

  it('preserves the params expression when a placeholder forces a pick call', () => {
    const source = [
      "import { t } from 'yapyak';",
      "export const x = t('Hi {name}', { name: 'Alex' });",
    ].join('\n');
    const callSite = findFirstCallSite(source);
    if (!callSite) {
      throw new Error('expected a call site');
    }
    const result = renderCallReplacement({
      callSite,
      defaultLocale: 'en',
      locales: [
        'en',
        'sv',
      ],
      localsByFactory: new Map(),
      pickLocal: '_pick',
      registerCatalog: (_literal, id) => `_catalog_${id}`,
      singleLocale: false,
      translations: {
        sv: {
          'Hi {name}': 'Hej {name}',
        },
      },
    });
    expect(result?.code).toMatch(/^_pick\(_catalog_/);
    expect(result?.code).toContain("{ name: 'Alex' }");
  });
});
