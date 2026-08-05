import { describe, expect, it } from 'vitest';

import { parseTemplate } from '../../../../template';
import {
  buildCatalogLiteral,
  isStaticTemplate,
  pickLocaleText,
  renderLocaleKey,
  toSafeJsString,
} from './render';

describe('toSafeJsString', () => {
  it('returns a single-quoted literal for plain ASCII', () => {
    expect(toSafeJsString('Hello')).toBe("'Hello'");
  });

  it('returns `\\u0027` for an embedded single quote', () => {
    expect(toSafeJsString("It's")).toBe("'It\\u0027s'");
  });

  it('returns `\\u0022` for an embedded double quote', () => {
    expect(toSafeJsString('"quoted"')).toBe("'\\u0022quoted\\u0022'");
  });

  it('returns `\\u007b` and `\\u007d` for embedded braces', () => {
    expect(toSafeJsString('{name}')).toBe("'\\u007bname\\u007d'");
  });

  it('returns `\\n` for a newline', () => {
    expect(toSafeJsString('a\nb')).toBe("'a\\nb'");
  });

  it('returns `\\t` for a tab', () => {
    expect(toSafeJsString('a\tb')).toBe("'a\\tb'");
  });

  it('returns `\\\\` for a backslash', () => {
    expect(toSafeJsString('a\\b')).toBe("'a\\\\b'");
  });

  it('returns `\\u2028` for the line-separator code point', () => {
    expect(toSafeJsString('a b')).toBe("'a\\u2028b'");
  });
});

describe('pickLocaleText', () => {
  it('returns the source when locale equals the default locale', () => {
    expect(
      pickLocaleText({
        defaultLocale: 'en',
        id: 'Save',
        locale: 'en',
        source: 'Save',
        translations: {},
      }),
    ).toBe('Save');
  });

  it('returns the source when the locale map is missing', () => {
    expect(
      pickLocaleText({
        defaultLocale: 'en',
        id: 'Save',
        locale: 'sv',
        source: 'Save',
        translations: {},
      }),
    ).toBe('Save');
  });

  it('returns the source when the id is absent from the locale map', () => {
    expect(
      pickLocaleText({
        defaultLocale: 'en',
        id: 'Save',
        locale: 'sv',
        source: 'Save',
        translations: {
          sv: {
            Cancel: 'Avbryt',
          },
        },
      }),
    ).toBe('Save');
  });

  it('returns the translated text when present in the locale map', () => {
    expect(
      pickLocaleText({
        defaultLocale: 'en',
        id: 'Save',
        locale: 'sv',
        source: 'Save',
        translations: {
          sv: {
            Save: 'Spara',
          },
        },
      }),
    ).toBe('Spara');
  });
});

describe('renderLocaleKey', () => {
  it('returns the locale verbatim when it is a valid identifier', () => {
    expect(renderLocaleKey('sv')).toBe('sv');
  });

  it('returns a JSON-quoted key when the locale contains a hyphen', () => {
    expect(renderLocaleKey('sv-FI')).toBe('"sv-FI"');
  });
});

describe('isStaticTemplate', () => {
  it('returns true for an empty template', () => {
    expect(isStaticTemplate([])).toBe(true);
  });

  it('returns true for a template containing only literals', () => {
    const { template } = parseTemplate('Hello world');
    expect(isStaticTemplate(template)).toBe(true);
  });

  it('returns false for a template containing a placeholder', () => {
    const { template } = parseTemplate('Hi {name}');
    expect(isStaticTemplate(template)).toBe(false);
  });
});

describe('buildCatalogLiteral', () => {
  it('builds a single-locale catalog entry as a string-only object', () => {
    const usedFactories = new Set<string>();
    const result = buildCatalogLiteral(
      {
        defaultLocale: 'en',
        id: 'Save',
        locales: [
          'en',
        ],
        source: 'Save',
        translations: {},
      },
      usedFactories,
      new Map(),
    );
    expect(result).toBe("{ en: 'Save' }");
    expect(usedFactories.size).toBe(0);
  });

  it('builds a multi-locale catalog entry with picked translations', () => {
    const usedFactories = new Set<string>();
    const result = buildCatalogLiteral(
      {
        defaultLocale: 'en',
        id: 'Save',
        locales: [
          'en',
          'sv',
        ],
        source: 'Save',
        translations: {
          sv: {
            Save: 'Spara',
          },
        },
      },
      usedFactories,
      new Map(),
    );
    expect(result).toBe("{ en: 'Save', sv: 'Spara' }");
  });

  it('emits factory invocations for a placeholder-bearing source', () => {
    const usedFactories = new Set<string>();
    const result = buildCatalogLiteral(
      {
        defaultLocale: 'en',
        id: 'Hi {name}',
        locales: [
          'en',
        ],
        source: 'Hi {name}',
        translations: {},
      },
      usedFactories,
      new Map(),
    );
    expect(result).toContain('_literal');
    expect(result).toContain('_placeholder');
  });

  it('holds every used factory in the supplied set after rendering placeholders', () => {
    const usedFactories = new Set<string>();
    buildCatalogLiteral(
      {
        defaultLocale: 'en',
        id: 'Hi {name}',
        locales: [
          'en',
        ],
        source: 'Hi {name}',
        translations: {},
      },
      usedFactories,
      new Map(),
    );
    expect(usedFactories.has('literal')).toBe(true);
    expect(usedFactories.has('placeholder')).toBe(true);
  });
});
