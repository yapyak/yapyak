import type { ExtractTParams } from './t-param';

import { expectTypeOf, test } from 'vitest';

test('no placeholders → unknown', () => {
  expectTypeOf<ExtractTParams<'Save changes'>>().toEqualTypeOf<unknown>();
});

test('single simple placeholder', () => {
  expectTypeOf<ExtractTParams<'Hello, {name}!'>>().toEqualTypeOf<{
    name: string | number;
  }>();
});

test('multiple simple placeholders', () => {
  expectTypeOf<{ a: 'x'; b: 1 }>().toMatchTypeOf<ExtractTParams<'{a} {b}'>>();
});

test('ICU plural — count typed as number', () => {
  type Result =
    ExtractTParams<'You have {count, plural, one {# message} other {# messages}}'>;
  expectTypeOf<{ count: 3 }>().toMatchTypeOf<Result>();
});

test('ICU plural — string for count is rejected', () => {
  type Result =
    ExtractTParams<'You have {count, plural, one {# message} other {# messages}}'>;
  expectTypeOf<{ count: 'three' }>().not.toMatchTypeOf<Result>();
});

test('ICU selectordinal — typed as number', () => {
  type Result = ExtractTParams<'{n, selectordinal, one {1st} other {nth}}'>;
  expectTypeOf<{ n: 1 }>().toMatchTypeOf<Result>();
  expectTypeOf<{ n: 'one' }>().not.toMatchTypeOf<Result>();
});

test('ICU select with other — theme allows known branches and any string', () => {
  type Result =
    ExtractTParams<'{theme, select, dark {Dark mode} other {Light mode}}'>;
  expectTypeOf<{ theme: 'dark' }>().toMatchTypeOf<Result>();
  expectTypeOf<{ theme: 'custom-theme' }>().toMatchTypeOf<Result>();
  expectTypeOf<{ theme: 42 }>().not.toMatchTypeOf<Result>();
});

test('ICU select without other — theme typed as strict enum', () => {
  type Result = ExtractTParams<'{gender, select, male {Mr.} female {Ms.}}'>;
  expectTypeOf<{ gender: 'male' }>().toMatchTypeOf<Result>();
  expectTypeOf<{ gender: 'female' }>().toMatchTypeOf<Result>();
  expectTypeOf<{ gender: 'unknown' }>().not.toMatchTypeOf<Result>();
});

test('ICU number — amount typed as number', () => {
  type Result = ExtractTParams<'Price: {amount, number, currency EUR}'>;
  expectTypeOf<{ amount: 10 }>().toMatchTypeOf<Result>();
  expectTypeOf<{ amount: 'ten' }>().not.toMatchTypeOf<Result>();
});

test('ICU date — when typed as Date | number', () => {
  type Result = ExtractTParams<'Updated: {when, date, long}'>;
  expectTypeOf<{ when: Date }>().toMatchTypeOf<Result>();
  expectTypeOf<{ when: 1700000000000 }>().toMatchTypeOf<Result>();
  expectTypeOf<{ when: 'today' }>().not.toMatchTypeOf<Result>();
});

test('ICU time — when typed as Date | number', () => {
  type Result = ExtractTParams<'At: {when, time, short}'>;
  expectTypeOf<{ when: Date }>().toMatchTypeOf<Result>();
  expectTypeOf<{ when: 'now' }>().not.toMatchTypeOf<Result>();
});

test('mixed simple and ICU', () => {
  type Result =
    ExtractTParams<'Hi {name}, you have {count, plural, one {# msg} other {# msgs}}'>;
  expectTypeOf<{ name: 'A'; count: 3 }>().toMatchTypeOf<Result>();
});

test('ICU plural — extracts nested placeholders from branches', () => {
  type Result =
    ExtractTParams<'You have {count, plural, one {# by {author}} other {# by {author}}}'>;
  expectTypeOf<{ count: 1; author: 'Alex' }>().toMatchTypeOf<Result>();
  expectTypeOf<{ count: 1 }>().not.toMatchTypeOf<Result>();
});

test('ICU select — extracts nested placeholders from branches', () => {
  type Result =
    ExtractTParams<'{theme, select, dark {Hello {name}} other {Bye {name}}}'>;
  expectTypeOf<{ theme: 'dark'; name: 'Alex' }>().toMatchTypeOf<Result>();
  expectTypeOf<{ theme: 'dark' }>().not.toMatchTypeOf<Result>();
});

test('ICU branches with literal text do not introduce keys', () => {
  type Result = ExtractTParams<'{n, selectordinal, one {1st} other {nth}}'>;
  expectTypeOf<{ n: 1 }>().toMatchTypeOf<Result>();
});

test('unknown ICU format falls back to permissive value type', () => {
  type Result = ExtractTParams<'{x, mystery, body}'>;
  expectTypeOf<{ x: 'string-or-num' }>().toMatchTypeOf<Result>();
  expectTypeOf<{ x: 42 }>().toMatchTypeOf<Result>();
  expectTypeOf<{ x: Date }>().toMatchTypeOf<Result>();
});
