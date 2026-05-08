import { describe, expect, it } from 'vitest';
import { compileMessage } from './compile-message';
import { createIntlInstances } from './intl-instances';

function compile(
  message: string,
  locale = 'en',
): (params?: Record<string, unknown>) => string {
  const intl = createIntlInstances();
  const code = compileMessage(message, locale, intl);
  const body = `${intl.declarations.join('\n')}\nreturn ${code}`;
  const factory = new Function(body) as () => (
    params?: Record<string, unknown>,
  ) => string;
  return factory();
}

describe('compileMessage', () => {
  it('compiles literal text', () => {
    const fn = compile('Hello world');
    expect(fn()).toBe('Hello world');
  });

  it('compiles placeholder interpolation', () => {
    const fn = compile('Hello, {name}!');
    expect(fn({ name: 'Joakim' })).toBe('Hello, Joakim!');
  });

  it('compiles multiple placeholders', () => {
    const fn = compile('{a} and {b}');
    expect(fn({ a: 'foo', b: 'bar' })).toBe('foo and bar');
  });

  it('compiles plural with exact and other cases', () => {
    const fn = compile(
      '{count, plural, =0 {No items} =1 {One item} other {# items}}',
    );
    expect(fn({ count: 0 })).toBe('No items');
    expect(fn({ count: 1 })).toBe('One item');
    expect(fn({ count: 5 })).toBe('5 items');
  });

  it('compiles select', () => {
    const fn = compile('{gender, select, female {She} male {He} other {They}}');
    expect(fn({ gender: 'female' })).toBe('She');
    expect(fn({ gender: 'male' })).toBe('He');
    expect(fn({ gender: 'unknown' })).toBe('They');
  });

  it('compiles plural with category cases via PluralRules', () => {
    const fn = compile('{count, plural, one {one item} other {# items}}');
    expect(fn({ count: 1 })).toBe('one item');
    expect(fn({ count: 3 })).toBe('3 items');
  });
});
