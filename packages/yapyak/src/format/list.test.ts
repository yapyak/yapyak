import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatList } from './list';

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

describe('formatList', () => {
  it('returns a conjunction-joined string by default', () => {
    setLocale('en');
    expect(formatList(['Rails', 'React', 'Vite'])).toBe(
      'Rails, React, and Vite',
    );
  });

  it('returns a disjunction-joined string when `type` is `disjunction`', () => {
    setLocale('en');
    expect(formatList(['en', 'sv'], { type: 'disjunction' })).toBe('en or sv');
  });

  it('returns a Swedish-formatted list when the active locale is `sv`', () => {
    setLocale('sv');
    expect(formatList(['en', 'sv'])).toMatch(/och|or/);
  });
});
