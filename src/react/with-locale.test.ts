import { afterEach, describe, expect, it } from 'vitest';
import { configureLocale, resetLocaleStore } from '../locale/store.js';
import { withLocale } from './with-locale.js';

afterEach(() => {
  resetLocaleStore();
});

describe('withLocale', () => {
  it('returns string for nullary key in current locale', () => {
    configureLocale({
      defaultLocale: 'en',
      initialLocale: 'sv',
      locales: ['en', 'sv'],
    });
    const t = withLocale({
      cta: {
        en: 'Open inbox',
        sv: 'Öppna inkorgen',
      },
    });
    expect(t.cta).toBe('Öppna inkorgen');
  });

  it('returns function for parametric key', () => {
    configureLocale({
      defaultLocale: 'en',
      initialLocale: 'sv',
      locales: ['en', 'sv'],
    });
    const t = withLocale({
      greeting: {
        en: ({ name }: { name: string }) => `Hello ${name}`,
        sv: ({ name }: { name: string }) => `Hej ${name}`,
      },
    });
    const fn = t.greeting as (params: { name: string }) => string;
    expect(fn({ name: 'Joakim' })).toBe('Hej Joakim');
  });

  it('falls back to defaultLocale when current locale is missing', () => {
    configureLocale({
      defaultLocale: 'en',
      initialLocale: 'sv',
      locales: ['en', 'sv', 'fr'],
    });
    const t = withLocale({
      cta: {
        en: 'Open inbox',
      },
    });
    expect(t.cta).toBe('Open inbox');
  });

  it('reflects locale changes between accesses', () => {
    const store = configureLocale({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    const t = withLocale({
      cta: {
        en: 'Open inbox',
        sv: 'Öppna inkorgen',
      },
    });
    expect(t.cta).toBe('Open inbox');
    store.set('sv');
    expect(t.cta).toBe('Öppna inkorgen');
  });

  it('exposes .in() that binds to specific locale', () => {
    configureLocale({
      defaultLocale: 'en',
      locales: ['en', 'sv', 'fr'],
    });
    const t = withLocale({
      cta: {
        en: 'Open inbox',
        sv: 'Öppna inkorgen',
        fr: 'Ouvrir',
      },
    });
    expect(t.in('sv').cta).toBe('Öppna inkorgen');
    expect(t.in('fr').cta).toBe('Ouvrir');
  });

  it('.in() does not affect base proxy', () => {
    configureLocale({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    const t = withLocale({
      cta: {
        en: 'Open inbox',
        sv: 'Öppna inkorgen',
      },
    });
    void t.in('sv').cta;
    expect(t.cta).toBe('Open inbox');
  });

  it('returns undefined for unknown keys', () => {
    configureLocale({
      defaultLocale: 'en',
      locales: ['en'],
    });
    const t = withLocale({
      cta: { en: 'Open inbox' },
    }) as unknown as Record<string, unknown>;
    expect(t.unknown).toBeUndefined();
  });

  it('Object.keys reflects schema keys plus in', () => {
    configureLocale({
      defaultLocale: 'en',
      locales: ['en'],
    });
    const t = withLocale({
      cta: { en: 'Open inbox' },
      greeting: { en: () => 'Hi' },
    });
    expect(Object.keys(t).sort()).toEqual(['cta', 'greeting', 'in']);
  });
});
