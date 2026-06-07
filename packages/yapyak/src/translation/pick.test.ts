import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { pick } from './pick';

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

describe('pick', () => {
  it('returns the active-locale variant', () => {
    setLocale('sv');
    expect(pick({ en: 'Save', sv: 'Spara' })).toBe('Spara');
  });

  it('returns the default-locale variant when no active match', () => {
    setLocale('en');
    expect(pick({ en: 'Save', sv: 'Spara' })).toBe('Save');
  });

  it('preserves a forced locale via options', () => {
    setLocale('en');
    expect(pick({ en: 'Save', sv: 'Spara' }, { locale: 'sv' })).toBe('Spara');
  });

  it('preserves a forced locale via options when params slot is undefined', () => {
    setLocale('en');
    expect(pick({ en: 'Save', sv: 'Spara' }, undefined, { locale: 'sv' })).toBe(
      'Spara',
    );
  });

  it('interpolates params for a source with placeholders', () => {
    setLocale('en');
    expect(
      pick({ en: 'Hi, {name}!', sv: 'Hej, {name}!' }, { name: 'Alex' }),
    ).toBe('Hi, Alex!');
  });

  it('preserves a forced locale together with params', () => {
    setLocale('en');
    expect(
      pick(
        { en: 'Hi, {name}!', sv: 'Hej, {name}!' },
        { name: 'Alex' },
        { locale: 'sv' },
      ),
    ).toBe('Hej, Alex!');
  });
});
