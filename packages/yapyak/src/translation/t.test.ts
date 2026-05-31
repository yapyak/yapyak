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

    it('honors the last locale when chained', () => {
      setLocale('en');
      expect(t.in('sv').in('en')('{count, number}', { count: 1000 })).toBe(
        '1,000',
      );
    });
  });

  describe('at', () => {
    it('returns the source unchanged when there are no params', () => {
      expect(t.at('button', 'Save')).toBe('Save');
    });

    it('interpolates a placeholder when params are provided', () => {
      expect(t.at('greeting', 'Hello, {name}!', { name: 'Alex' })).toBe(
        'Hello, Alex!',
      );
    });

    it('ignores the context argument at runtime', () => {
      expect(t.at('button', 'Save')).toBe(t.at('heading', 'Save'));
    });
  });
});
