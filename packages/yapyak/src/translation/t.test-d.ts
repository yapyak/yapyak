import type { Locale } from '../locale';
import type { TAsChain, TInChain, TReturn } from './t';

import { describe, expectTypeOf, it } from 'vitest';

import { t } from './t';

describe('t', () => {
  it('returns an untagged string for a source without tags', () => {
    expectTypeOf(t('Save changes')).toEqualTypeOf<TReturn<never, never>>();
  });

  it('returns a tagged type for the tag names in the source', () => {
    expectTypeOf(t('Read <link>terms</link>')).toEqualTypeOf<
      TReturn<'link', never>
    >();
  });

  it('holds params for a source with placeholders', () => {
    expectTypeOf(
      t('Hello, {name}!', {
        name: 'Alex',
      }),
    ).toExtend<string>();
  });

  it('returns an untagged string from `t.in(locale, source)`', () => {
    expectTypeOf(t.in('sv', 'Save')).toEqualTypeOf<TReturn<never, never>>();
  });

  it('preserves tag extraction through `t.in(locale, source)`', () => {
    expectTypeOf(t.in('sv', 'Read <link>terms</link>')).toEqualTypeOf<
      TReturn<'link', never>
    >();
  });

  it('returns a TInChain when `in` is called with only a locale', () => {
    expectTypeOf(t.in('sv')).toEqualTypeOf<TInChain>();
  });

  it('returns an untagged string from `t.in(locale).as(context, source)`', () => {
    expectTypeOf(t.in('sv').as('action', 'Save')).toEqualTypeOf<
      TReturn<never, never>
    >();
  });

  it('returns an untagged string from `at` without placeholders', () => {
    expectTypeOf(t.as('button', 'Save')).toEqualTypeOf<TReturn<never, never>>();
  });

  it('holds params from `at` for a source with placeholders', () => {
    expectTypeOf(
      t.as('greeting', 'Hello, {name}!', {
        name: 'Alex',
      }),
    ).toEqualTypeOf<TReturn<never, never>>();
  });

  it('preserves tag extraction through `at`', () => {
    expectTypeOf(t.as('paragraph', 'Read <link>terms</link>')).toEqualTypeOf<
      TReturn<'link', never>
    >();
  });

  it('returns a TAsChain when `at` is called with only a context', () => {
    expectTypeOf(t.as('action')).toEqualTypeOf<TAsChain>();
  });

  it('returns an untagged string from `t.as(context).in(locale, source)`', () => {
    expectTypeOf(t.as('action').in('sv', 'Save')).toEqualTypeOf<
      TReturn<never, never>
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

  it('holds a `number` param for an ICU `number`-format placeholder', () => {
    expectTypeOf(
      t<'Price: {amount, number, currency EUR}'>,
    ).parameters.toEqualTypeOf<
      [
        'Price: {amount, number, currency EUR}',
        {
          amount: number;
        },
      ]
    >();
  });

  it('holds a `number` param for an ICU `plural` placeholder', () => {
    expectTypeOf(
      t<'You have {count, plural, one {# item} other {# items}}'>,
    ).parameters.toEqualTypeOf<
      [
        'You have {count, plural, one {# item} other {# items}}',
        {
          count: number;
        },
      ]
    >();
  });

  it('holds a `string` param for an ICU `select` placeholder', () => {
    expectTypeOf(
      t('{theme, select, dark {Dark mode} other {Light mode}}', {
        theme: 'dark',
      }),
    ).toEqualTypeOf<TReturn<never, never>>();
  });

  it('holds a `Date`-or-`number` param for an ICU `date` placeholder', () => {
    expectTypeOf(t<'Updated: {when, date, long}'>).parameters.toEqualTypeOf<
      [
        'Updated: {when, date, long}',
        {
          when: Date | number;
        },
      ]
    >();
  });

  it('holds every param when a source has multiple placeholders', () => {
    expectTypeOf(
      t('You have {count, plural, one {# by {author}} other {# by {author}}}', {
        author: 'Alex',
        count: 3,
      }),
    ).toEqualTypeOf<TReturn<never, never>>();
  });

  it('returns a void-tagged type for a self-closing tag', () => {
    expectTypeOf(t('Line<br/>break')).toEqualTypeOf<TReturn<never, 'br'>>();
  });

  it('returns a mixed-tag type for pair and void tags', () => {
    expectTypeOf(t('<b>x</b><br/>')).toEqualTypeOf<TReturn<'b', 'br'>>();
  });

  it('returns a tagged type for two pair tags', () => {
    expectTypeOf(t('<a>x</a><b>y</b>')).toEqualTypeOf<
      TReturn<'a' | 'b', never>
    >();
  });

  it('returns a tagged type for nested pair tags', () => {
    expectTypeOf(t('<a><b>x</b></a>')).toEqualTypeOf<
      TReturn<'a' | 'b', never>
    >();
  });

  it('preserves tag extraction when a placeholder sits inside a tag', () => {
    expectTypeOf(
      t('Hi <b>{name}</b>', {
        name: 'Alex',
      }),
    ).toEqualTypeOf<TReturn<'b', never>>();
  });

  it('holds the `as` key on `TInChain`', () => {
    expectTypeOf<keyof TInChain>().toEqualTypeOf<'as'>();
  });

  it('holds the `in` key on `TAsChain`', () => {
    expectTypeOf<keyof TAsChain>().toEqualTypeOf<'in'>();
  });

  it('refuses a callable signature for `TInChain`', () => {
    expectTypeOf<TInChain>().not.toExtend<(...args: unknown[]) => unknown>();
  });

  it('refuses a callable signature for `TAsChain`', () => {
    expectTypeOf<TAsChain>().not.toExtend<(...args: unknown[]) => unknown>();
  });

  it('preserves placeholder params for `t.in(locale).as(context, source)`', () => {
    expectTypeOf(
      t.in('sv').as('greeting', 'Hi {name}', {
        name: 'Alex',
      }),
    ).toEqualTypeOf<TReturn<never, never>>();
  });

  it('preserves placeholder params for `t.as(context).in(locale, source)`', () => {
    expectTypeOf(
      t.as('greeting').in('sv', 'Hi {name}', {
        name: 'Alex',
      }),
    ).toEqualTypeOf<TReturn<never, never>>();
  });

  it('preserves tag extraction for `t.in(locale).as(context, source)`', () => {
    expectTypeOf(t.in('sv').as('button', '<a>x</a>')).toEqualTypeOf<
      TReturn<'a', never>
    >();
  });

  it('preserves tag extraction for `t.as(context).in(locale, source)`', () => {
    expectTypeOf(t.as('button').in('sv', '<a>x</a>')).toEqualTypeOf<
      TReturn<'a', never>
    >();
  });
});
