import { describe, expect, it } from 'vitest';

import { applyLocaleToUrl, getLocaleFromUrl } from './url';

const LOCALES = ['en', 'sv', 'de', 'sv-SE'] as const;

describe('getLocaleFromUrl (default path-first-segment)', () => {
  it('extracts locale from first path segment', () => {
    expect(getLocaleFromUrl(new URL('https://app.test/sv/home'), LOCALES)).toBe(
      'sv',
    );
  });

  it('handles bare locale without trailing slash', () => {
    expect(getLocaleFromUrl(new URL('https://app.test/sv'), LOCALES)).toBe(
      'sv',
    );
  });

  it('handles trailing slash', () => {
    expect(getLocaleFromUrl(new URL('https://app.test/sv/'), LOCALES)).toBe(
      'sv',
    );
  });

  it('handles deep paths', () => {
    expect(
      getLocaleFromUrl(new URL('https://app.test/de/a/b/c'), LOCALES),
    ).toBe('de');
  });

  it('returns undefined for root path', () => {
    expect(getLocaleFromUrl(new URL('https://app.test/'), LOCALES)).toBe(
      undefined,
    );
  });

  it('returns undefined when first segment is not a known locale', () => {
    expect(getLocaleFromUrl(new URL('https://app.test/about'), LOCALES)).toBe(
      undefined,
    );
  });

  it('is case-sensitive', () => {
    expect(getLocaleFromUrl(new URL('https://app.test/SV/home'), LOCALES)).toBe(
      undefined,
    );
  });

  it('ignores query string', () => {
    expect(
      getLocaleFromUrl(new URL('https://app.test/en/home?foo=bar'), LOCALES),
    ).toBe('en');
  });

  it('matches locales with hyphens', () => {
    expect(
      getLocaleFromUrl(new URL('https://app.test/sv-SE/home'), LOCALES),
    ).toBe('sv-SE');
  });
});

describe('getLocaleFromUrl (query-string regex)', () => {
  const pattern = /[?&]lang=(?<locale>[a-z]{2})/;

  it('extracts from query param', () => {
    expect(
      getLocaleFromUrl(
        new URL('https://app.test/about?lang=sv'),
        LOCALES,
        pattern,
      ),
    ).toBe('sv');
  });

  it('extracts when query has multiple params', () => {
    expect(
      getLocaleFromUrl(
        new URL('https://app.test/about?foo=bar&lang=de'),
        LOCALES,
        pattern,
      ),
    ).toBe('de');
  });

  it('returns undefined when query missing', () => {
    expect(
      getLocaleFromUrl(new URL('https://app.test/about'), LOCALES, pattern),
    ).toBe(undefined);
  });

  it('returns undefined when captured value not in locales', () => {
    expect(
      getLocaleFromUrl(
        new URL('https://app.test/about?lang=fr'),
        LOCALES,
        pattern,
      ),
    ).toBe(undefined);
  });
});

describe('getLocaleFromUrl (regex with capture group 1)', () => {
  const pattern = /^\/app\/([a-z]{2})/;

  it('uses group 1 when no named group', () => {
    expect(
      getLocaleFromUrl(
        new URL('https://app.test/app/sv/home'),
        LOCALES,
        pattern,
      ),
    ).toBe('sv');
  });
});

describe('applyLocaleToUrl (default path-first-segment)', () => {
  it('replaces existing locale segment', () => {
    expect(
      applyLocaleToUrl(new URL('https://app.test/en/home'), 'sv', LOCALES),
    ).toBe('/sv/home');
  });

  it('prepends locale when path has no locale', () => {
    expect(
      applyLocaleToUrl(new URL('https://app.test/about'), 'sv', LOCALES),
    ).toBe('/sv/about');
  });

  it('prepends locale on root path', () => {
    expect(applyLocaleToUrl(new URL('https://app.test/'), 'sv', LOCALES)).toBe(
      '/sv',
    );
  });

  it('preserves query string when replacing', () => {
    expect(
      applyLocaleToUrl(
        new URL('https://app.test/en/home?q=foo'),
        'sv',
        LOCALES,
      ),
    ).toBe('/sv/home?q=foo');
  });

  it('preserves hash when replacing', () => {
    expect(
      applyLocaleToUrl(
        new URL('https://app.test/en/home#section'),
        'sv',
        LOCALES,
      ),
    ).toBe('/sv/home#section');
  });

  it('handles bare locale path', () => {
    expect(
      applyLocaleToUrl(new URL('https://app.test/en'), 'sv', LOCALES),
    ).toBe('/sv');
  });

  it('handles hyphenated locales', () => {
    expect(
      applyLocaleToUrl(new URL('https://app.test/sv-SE/home'), 'en', LOCALES),
    ).toBe('/en/home');
  });
});

describe('applyLocaleToUrl (query-string regex)', () => {
  const pattern = /[?&]lang=(?<locale>[a-z]{2})/;

  it('replaces query param locale', () => {
    expect(
      applyLocaleToUrl(
        new URL('https://app.test/about?lang=en'),
        'sv',
        LOCALES,
        pattern,
      ),
    ).toBe('/about?lang=sv');
  });

  it('returns original URL when query missing (no match)', () => {
    expect(
      applyLocaleToUrl(
        new URL('https://app.test/about'),
        'sv',
        LOCALES,
        pattern,
      ),
    ).toBe('/about');
  });

  it('replaces locale among other query params', () => {
    expect(
      applyLocaleToUrl(
        new URL('https://app.test/about?foo=bar&lang=en&other=x'),
        'sv',
        LOCALES,
        pattern,
      ),
    ).toBe('/about?foo=bar&lang=sv&other=x');
  });
});
