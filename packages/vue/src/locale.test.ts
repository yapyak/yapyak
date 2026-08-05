import type { Locale } from 'yapyak';

import { afterEach, describe, expect, it } from 'vitest';
import { effect } from 'vue';
import { getLocale, setLocale } from 'yapyak';
import { pick } from 'yapyak/internal';

import { locale, registerLocale } from './locale';

afterEach(() => {
  setLocale('en');
});

describe('locale', () => {
  it('returns the current locale on `value` read', () => {
    setLocale('sv');
    expect(locale.value).toBe('sv');
  });

  it('writes the new locale on `value` write', () => {
    locale.value = 'sv';
    expect(getLocale()).toBe('sv');
  });
});

describe('registerLocale', () => {
  it('notifies effects reading `locale` when the locale changes', () => {
    let observed: Locale | undefined;
    effect(() => {
      observed = locale.value;
    });
    setLocale('sv');

    expect(observed).toBe('sv');
  });

  it('notifies effects calling `pick()` when the locale changes', () => {
    let observed: string | undefined;
    effect(() => {
      observed = pick({
        en: 'Hello',
        sv: 'Hej',
      });
    });
    setLocale('sv');

    expect(observed).toBe('Hej');
  });

  it('registers no second subscription when called twice', () => {
    let runs = 0;
    effect(() => {
      runs += 1;
      void locale.value;
    });
    registerLocale();
    setLocale('sv');

    expect(runs).toBe(2);
  });
});
