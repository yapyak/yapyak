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
      expect(t.in('sv', 'You have {count, number}', { count: 1000 })).toMatch(
        /1.000/,
      );
    });

    it('returns the source unchanged when there are no params', () => {
      expect(t.in('sv', 'Hej')).toBe('Hej');
    });

    it('interpolates a placeholder when params are provided', () => {
      expect(t.in('sv', 'Hej, {name}!', { name: 'Alex' })).toBe('Hej, Alex!');
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

  describe('inline chain', () => {
    it('combines in and at via t.in(locale).at(context, source)', () => {
      setLocale('en');
      expect(
        t.in('sv').at('action', 'You have {count, number}', { count: 1000 }),
      ).toMatch(/1.000/);
    });

    it('combines at and in via t.at(context).in(locale, source)', () => {
      setLocale('en');
      expect(
        t.at('action').in('sv', 'You have {count, number}', { count: 1000 }),
      ).toMatch(/1.000/);
    });

    it('returns the source unchanged when chained without params', () => {
      expect(t.in('sv').at('action', 'Open')).toBe('Open');
      expect(t.at('action').in('sv', 'Open')).toBe('Open');
    });
  });
});
