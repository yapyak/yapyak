import type { Locale } from '../locale';
import type { TAsChain, TInChain, TReturn } from './t';

import { describe, expectTypeOf, it } from 'vitest';

import { t } from './t';

describe('t', () => {
  it('returns an untagged string for a source without tags', () => {
    expectTypeOf(t('Save changes')).toEqualTypeOf<TReturn<never>>();
  });

  it('returns a tagged type for the tag names in the source', () => {
    expectTypeOf(t('Read <link>terms</link>')).toEqualTypeOf<TReturn<'link'>>();
  });

  it('holds params for a source with placeholders', () => {
    expectTypeOf(
      t('Hello, {name}!', {
        name: 'Alex',
      }),
    ).toExtend<string>();
  });

  it('returns an untagged string from `t.in(locale, source)`', () => {
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

  it('returns an untagged string from `t.in(locale).as(context, source)`', () => {
    expectTypeOf(t.in('sv').as('action', 'Save')).toEqualTypeOf<
      TReturn<never>
    >();
  });

  it('returns an untagged string from `at` without placeholders', () => {
    expectTypeOf(t.as('button', 'Save')).toEqualTypeOf<TReturn<never>>();
  });

  it('holds params from `at` for a source with placeholders', () => {
    expectTypeOf(
      t.as('greeting', 'Hello, {name}!', {
        name: 'Alex',
      }),
    ).toEqualTypeOf<TReturn<never>>();
  });

  it('preserves tag extraction through `at`', () => {
    expectTypeOf(t.as('paragraph', 'Read <link>terms</link>')).toEqualTypeOf<
      TReturn<'link'>
    >();
  });

  it('returns a TAsChain when `at` is called with only a context', () => {
    expectTypeOf(t.as('action')).toEqualTypeOf<TAsChain>();
  });

  it('returns an untagged string from `t.as(context).in(locale, source)`', () => {
    expectTypeOf(t.as('action').in('sv', 'Save')).toEqualTypeOf<
      TReturn<never>
    >();
  });

  it('preserves the `at` return assignable to `string`', () => {
    expectTypeOf(t.as('button', 'Save')).toExtend<string>();
  });

  it('holds a single source argument when source has no placeholders', () => {
    expectTypeOf(t<'Save'>).parameters.toEqualTypeOf<
      [
        'Save',
      ]
    >();
  });

  it('holds source and a required params tuple when source has placeholders', () => {
    expectTypeOf(t<'Hello, {name}!'>).parameters.toEqualTypeOf<
      [
        'Hello, {name}!',
        {
          name: string | number;
        },
      ]
    >();
  });

  it('holds locale, source, and params on `t.in()` with placeholders', () => {
    expectTypeOf(t.in<'Hello, {name}!'>).parameters.toEqualTypeOf<
      [
        Locale,
        'Hello, {name}!',
        {
          name: string | number;
        },
      ]
    >();
  });

  it('holds context, source, and params on `t.as()` with placeholders', () => {
    expectTypeOf(t.as<string, 'Hello, {name}!'>).parameters.toEqualTypeOf<
      [
        string,
        'Hello, {name}!',
        {
          name: string | number;
        },
      ]
    >();
  });

  it('refuses a context literal that contains an `@`', () => {
    expectTypeOf(t.as<'btn@x', 'Save'>).parameters.toEqualTypeOf<
      [
        {
          $yapyakTypeError: `Invalid context "btn@x": '@' is reserved as the source/context separator`;
        },
        'Save',
      ]
    >();
  });

  it('refuses an `@` in the context on the `t.in(locale).as()` chain', () => {
    expectTypeOf(t.in('sv').as<'btn@x', 'Save'>).parameters.toEqualTypeOf<
      [
        {
          $yapyakTypeError: `Invalid context "btn@x": '@' is reserved as the source/context separator`;
        },
        'Save',
      ]
    >();
  });
});
