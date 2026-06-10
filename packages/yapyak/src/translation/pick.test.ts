import { afterEach, describe, expect, it } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { literal, placeholder } from '../template';
import { pick } from './pick';

afterEach(() => {
  resetLocale();
});

describe('pick', () => {
  it('returns the active-locale variant', () => {
    setLocale('sv');
    expect(
      pick({
        en: 'Save',
        sv: 'Spara',
      }),
    ).toBe('Spara');
  });

  it('returns the default-locale variant when no active match', () => {
    setLocale('en');
    expect(
      pick({
        en: 'Save',
        sv: 'Spara',
      }),
    ).toBe('Save');
  });

  it('preserves a forced locale via options', () => {
    setLocale('en');
    expect(
      pick(
        {
          en: 'Save',
          sv: 'Spara',
        },
        {
          locale: 'sv',
        },
      ),
    ).toBe('Spara');
  });

  it('preserves a forced locale via options when params slot is undefined', () => {
    setLocale('en');
    expect(
      pick(
        {
          en: 'Save',
          sv: 'Spara',
        },
        undefined,
        {
          locale: 'sv',
        },
      ),
    ).toBe('Spara');
  });

  it('interprets an AST variant with params', () => {
    setLocale('en');
    expect(
      pick(
        {
          en: [
            literal('Hi, '),
            placeholder('name'),
            literal('!'),
          ],
          sv: [
            literal('Hej, '),
            placeholder('name'),
            literal('!'),
          ],
        },
        {
          name: 'Alex',
        },
      ),
    ).toBe('Hi, Alex!');
  });

  it('preserves a forced locale together with params for an AST variant', () => {
    setLocale('en');
    expect(
      pick(
        {
          en: [
            literal('Hi, '),
            placeholder('name'),
            literal('!'),
          ],
          sv: [
            literal('Hej, '),
            placeholder('name'),
            literal('!'),
          ],
        },
        {
          name: 'Alex',
        },
        {
          locale: 'sv',
        },
      ),
    ).toBe('Hej, Alex!');
  });

  it('mixes string and AST variants across locales', () => {
    setLocale('en');
    expect(
      pick(
        {
          en: 'Hi, Alex!',
          sv: [
            literal('Hej, '),
            placeholder('name'),
            literal('!'),
          ],
        },
        {
          name: 'Alex',
        },
      ),
    ).toBe('Hi, Alex!');
  });

  it('returns a string variant as-is without invoking the interpreter', () => {
    setLocale('en');
    expect(
      pick({
        en: 'Pre-rendered',
        sv: 'Färdig',
      }),
    ).toBe('Pre-rendered');
  });
});
