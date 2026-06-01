import type { TAtChain, TInChain, TReturn } from './t';

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

  it('translates inline with `t.in(locale, source)`', () => {
    expectTypeOf(t.in('sv', 'Save')).toEqualTypeOf<TReturn<never>>();
  });

  it('preserves tag extraction through `t.in(locale, source)`', () => {
    expectTypeOf(t.in('sv', 'Read <link>terms</link>')).toEqualTypeOf<
      TReturn<'link'>
    >();
  });

  it('returns a TInChain when `in` is called with only a locale', () => {
    expectTypeOf(t.in('sv')).toEqualTypeOf<TInChain>();
  });

  it('translates from `t.in(locale).at(context, source)`', () => {
    expectTypeOf(t.in('sv').at('action', 'Open')).toEqualTypeOf<
      TReturn<never>
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

  it('returns a TAtChain when `at` is called with only a context', () => {
    expectTypeOf(t.at('action')).toEqualTypeOf<TAtChain>();
  });

  it('translates from `t.at(context).in(locale, source)`', () => {
    expectTypeOf(t.at('action').in('sv', 'Open')).toEqualTypeOf<
      TReturn<never>
    >();
  });

  it('keeps the `at` return assignable to `string`', () => {
    expectTypeOf(t.at('button', 'Save')).toExtend<string>();
  });
});
