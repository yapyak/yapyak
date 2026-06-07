import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { t } from './t';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv'],
  PERSISTENCE_CONFIG: { type: 'none' },
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

  it('interpolates a number placeholder for the active locale', () => {
    setLocale('en');
    expect(t('You have {count, number} points', { count: 1000 })).toContain(
      '1,000',
    );
  });

  describe('in', () => {
    it('interpolates for the scoped locale regardless of the active locale', () => {
      setLocale('en');
      expect(t.in('sv', 'You have {count, number}', { count: 1000 })).toMatch(
        /1\D000/,
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

    it('blocks the context argument from affecting runtime output', () => {
      expect(t.at('button', 'Save')).toBe(t.at('heading', 'Save'));
    });
  });

  describe('inline chain', () => {
    it('folds in and at via t.in(locale).at(context, source)', () => {
      setLocale('en');
      expect(
        t.in('sv').at('action', 'You have {count, number}', { count: 1000 }),
      ).toMatch(/1\D000/);
    });

    it('folds at and in via t.at(context).in(locale, source)', () => {
      setLocale('en');
      expect(
        t.at('action').in('sv', 'You have {count, number}', { count: 1000 }),
      ).toMatch(/1\D000/);
    });

    it('returns the source unchanged when chained without params', () => {
      expect(t.in('sv').at('action', 'Save')).toBe('Save');
      expect(t.at('action').in('sv', 'Save')).toBe('Save');
    });
  });
});
