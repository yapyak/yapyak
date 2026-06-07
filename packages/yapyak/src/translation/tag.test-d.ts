import type { ExtractTags } from './tag';

import { describe, expectTypeOf, it } from 'vitest';

describe('ExtractTags', () => {
  it('resolves `never` when the source has no tags', () => {
    expectTypeOf<ExtractTags<'Save changes'>>().toEqualTypeOf<never>();
  });

  it('extracts a single tag name', () => {
    expectTypeOf<
      ExtractTags<'Read <link>terms</link>'>
    >().toEqualTypeOf<'link'>();
  });

  it('extracts multiple tag names', () => {
    expectTypeOf<
      ExtractTags<'<b>bold</b> and <link>link</link>'>
    >().toEqualTypeOf<'b' | 'link'>();
  });

  it('extracts tags nested inside other tags', () => {
    expectTypeOf<ExtractTags<'<b><link>terms</link></b>'>>().toEqualTypeOf<
      'b' | 'link'
    >();
  });

  it('extracts tags inside ICU branches', () => {
    expectTypeOf<
      ExtractTags<'{n, plural, one {<b>#</b>} other {<b>#</b>}}'>
    >().toEqualTypeOf<'b'>();
  });

  it('blocks closing tags and tags with attributes', () => {
    expectTypeOf<
      ExtractTags<'an <a href="x">html</a> link'>
    >().toEqualTypeOf<never>();
  });
});
