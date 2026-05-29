import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { t } from './t';

vi.mock('@yapyak/shared', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

afterEach(() => {
  resetLocale();
});

describe('t', () => {
  it('returns the source unchanged when there are no params', () => {
    expect(t('Save changes')).toBe('Save changes');
  });

  it('interpolates a named placeholder', () => {
    expect(t('Hello, {name}!', { name: 'Alex' })).toBe('Hello, Alex!');
  });

  it('formats a number placeholder for the active locale', () => {
    setLocale('en');
    expect(t('You have {count, number} points', { count: 1000 })).toContain(
      '1,000',
    );
  });

  describe('in', () => {
    it('formats for the scoped locale regardless of the active locale', () => {
      setLocale('en');
      expect(t.in('sv')('You have {count, number}', { count: 1000 })).toMatch(
        /1.000/,
      );
    });

    it('returns a reusable translator', () => {
      const sv = t.in('sv');
      expect(sv('Hej')).toBe('Hej');
      expect(sv('Hej, {name}!', { name: 'Alex' })).toBe('Hej, Alex!');
    });
  });
});
