import type { ExtractPairTags, ExtractVoidTags } from './tag';

import { describe, expectTypeOf, it } from 'vitest';

describe('ExtractPairTags', () => {
  it('resolves `never` when the source has no tags', () => {
    expectTypeOf<ExtractPairTags<'Save changes'>>().toEqualTypeOf<never>();
  });

  it('extracts a single tag name', () => {
    expectTypeOf<
      ExtractPairTags<'Read <link>terms</link>'>
    >().toEqualTypeOf<'link'>();
  });

  it('extracts multiple tag names', () => {
    expectTypeOf<
      ExtractPairTags<'<b>bold</b> and <link>link</link>'>
    >().toEqualTypeOf<'b' | 'link'>();
  });

  it('extracts tags nested inside other tags', () => {
    expectTypeOf<ExtractPairTags<'<b><link>terms</link></b>'>>().toEqualTypeOf<
      'b' | 'link'
    >();
  });

  it('extracts tags inside ICU branches', () => {
    expectTypeOf<
      ExtractPairTags<'{n, plural, one {<b>#</b>} other {<b>#</b>}}'>
    >().toEqualTypeOf<'b'>();
  });

  it('blocks closing tags and tags with attributes', () => {
    expectTypeOf<
      ExtractPairTags<'an <a href="x">html</a> link'>
    >().toEqualTypeOf<never>();
  });

  it('blocks void tags from pair extraction', () => {
    expectTypeOf<ExtractPairTags<'line<br/>break'>>().toEqualTypeOf<never>();
  });

  it('extracts pair tags surrounding a void tag', () => {
    expectTypeOf<
      ExtractPairTags<'<link>hi<br/>there</link>'>
    >().toEqualTypeOf<'link'>();
  });
});

describe('ExtractVoidTags', () => {
  it('resolves `never` when the source has no void tags', () => {
    expectTypeOf<ExtractVoidTags<'Save changes'>>().toEqualTypeOf<never>();
  });

  it('extracts a single void tag name', () => {
    expectTypeOf<ExtractVoidTags<'line<br/>break'>>().toEqualTypeOf<'br'>();
  });

  it('extracts multiple void tag names', () => {
    expectTypeOf<ExtractVoidTags<'<icon/> and <break/>'>>().toEqualTypeOf<
      'icon' | 'break'
    >();
  });

  it('extracts a void tag nested inside a pair tag', () => {
    expectTypeOf<
      ExtractVoidTags<'<link>click <icon/> here</link>'>
    >().toEqualTypeOf<'icon'>();
  });

  it('blocks void tags with attributes', () => {
    expectTypeOf<
      ExtractVoidTags<'<input type="text"/>'>
    >().toEqualTypeOf<never>();
  });

  it('blocks pair tags from void extraction', () => {
    expectTypeOf<
      ExtractVoidTags<'<link>terms</link>'>
    >().toEqualTypeOf<never>();
  });
});
