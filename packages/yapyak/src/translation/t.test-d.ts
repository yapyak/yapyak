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

  it('accepts params and a trailing options argument', () => {
    expectTypeOf(
      t('Hello, {name}!', { name: 'Alex' }, { locale: 'sv' }),
    ).toExtend<string>();
  });
});
