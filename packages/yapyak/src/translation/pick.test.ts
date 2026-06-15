import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { literal, placeholder } from '../template';
import { pick } from './pick';

beforeEach(() => {
  vi.stubGlobal('window', {});
});

afterEach(() => {
  vi.unstubAllGlobals();
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

  it('walks the BCP 47 fallback chain when the exact tag is not present', () => {
    expect(
      pick(
        {
          en: 'Save',
          sv: 'Spara',
        },
        {
          locale: 'sv-FI',
        },
      ),
    ).toBe('Spara');
  });

  it('walks the default locale fallback chain when neither active nor its base match', () => {
    expect(
      pick(
        {
          en: 'Save',
          sv: 'Spara',
        },
        {
          locale: 'de-AT',
        },
      ),
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

  it('interpolates an AST variant with params', () => {
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

  it('picks string and AST variants across locales', () => {
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

  it('picks the default-locale variant when the active locale names a prototype method', () => {
    expect(
      pick(
        {
          en: 'Hello',
        },
        {
          locale: 'constructor',
        },
      ),
    ).toBe('Hello');
  });

  it('picks the default-locale variant when the active locale is `__proto__`', () => {
    expect(
      pick(
        {
          en: 'Hello',
        },
        {
          locale: '__proto__',
        },
      ),
    ).toBe('Hello');
  });

  it('returns the empty string when neither active nor default has a matching variant', () => {
    expect(
      pick(
        {
          sv: 'Hej',
        },
        {
          locale: 'constructor',
        },
      ),
    ).toBe('');
  });

  it('picks the default-locale variant when the locale option is not a key in `variants`', () => {
    expect(
      pick(
        {
          en: 'Hello',
        },
        {
          locale: 'xx',
        },
      ),
    ).toBe('Hello');
  });

  it('picks the matching variant when the locale option is a non-BCP-47 key the caller defined', () => {
    expect(
      pick(
        {
          custom: 'Greetings',
          en: 'Hello',
        },
        {
          locale: 'custom',
        },
      ),
    ).toBe('Greetings');
  });
});
