import { describe, expectTypeOf, it } from 'vitest';

import { t } from './t';

describe('t', () => {
  it('returns `string`', () => {
    expectTypeOf(t('Save changes')).toEqualTypeOf<string>();
  });

  it('accepts a source without params', () => {
    t('Save changes');
  });

  it('accepts an options-only argument for a source without params', () => {
    t('Save changes', { locale: 'sv' });
  });

  it('rejects an unknown option for a source without params', () => {
    // @ts-expect-error - `name` is not a valid option
    t('Save changes', { name: 'Alex' });
  });

  it('accepts matching params for a placeholder', () => {
    t('Hello, {name}!', { name: 'Alex' });
    t('Hello, {name}!', { name: 1 });
  });

  it('accepts a trailing options argument alongside params', () => {
    t('Hello, {name}!', { name: 'Alex' }, { locale: 'sv' });
  });

  it('requires params for a source with a placeholder', () => {
    // @ts-expect-error - params are required
    t('Hello, {name}!');
  });

  it('rejects a missing required param', () => {
    // @ts-expect-error - `name` is missing
    t('Hello, {name}!', {});
  });

  it('rejects a wrongly-typed param', () => {
    // @ts-expect-error - `name` must be a string or number
    t('Hello, {name}!', { name: true });
  });

  it('rejects an excess param', () => {
    // @ts-expect-error - `extra` is not a declared placeholder
    t('Hello, {name}!', { extra: 1, name: 'Alex' });
  });

  it('accepts a number for a plural argument', () => {
    t('You have {count, plural, one {# item} other {# items}}', { count: 2 });
  });

  it('rejects a string for a plural argument', () => {
    t('You have {count, plural, one {# item} other {# items}}', {
      // @ts-expect-error - `count` must be a number
      count: 'two',
    });
  });
});
