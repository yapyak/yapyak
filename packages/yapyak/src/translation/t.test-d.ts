import type { TReturn } from './t';

import { describe, expectTypeOf, it } from 'vitest';

import { t } from './t';

describe('t', () => {
  it('returns an untagged string for a source without tags', () => {
    expectTypeOf(t('Save changes')).toEqualTypeOf<TReturn<never>>();
  });

  it('brands the return with the tag names in the source', () => {
    expectTypeOf(t('Read <link>terms</link>')).toEqualTypeOf<TReturn<'link'>>();
  });

  it('accepts params for a source with placeholders', () => {
    expectTypeOf(t('Hello, {name}!', { name: 'Alex' })).toExtend<string>();
  });

  it('returns a `TFn` scoped to a locale from `in`', () => {
    expectTypeOf(t.in('sv')).toEqualTypeOf<typeof t>();
  });

  it('preserves tag extraction through `in`', () => {
    expectTypeOf(t.in('sv')('Read <link>terms</link>')).toEqualTypeOf<
      TReturn<'link'>
    >();
  });

  it('returns an untagged string from `at` without placeholders', () => {
    expectTypeOf(t.at('button', 'Save')).toEqualTypeOf<TReturn<never>>();
  });

  it('accepts params from `at` for a source with placeholders', () => {
    expectTypeOf(
      t.at('greeting', 'Hello, {name}!', { name: 'Alex' }),
    ).toEqualTypeOf<TReturn<never>>();
  });

  it('preserves tag extraction through `at`', () => {
    expectTypeOf(t.at('paragraph', 'Read <link>terms</link>')).toEqualTypeOf<
      TReturn<'link'>
    >();
  });

  it('keeps the `at` return assignable to `string`', () => {
    expectTypeOf(t.at('button', 'Save')).toExtend<string>();
  });
});
