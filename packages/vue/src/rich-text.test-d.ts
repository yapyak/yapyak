import type { VNodeChild } from 'vue';
import type { TReturn } from 'yapyak';
import type { RichTextSlots } from './rich-text';

import { describe, expectTypeOf, it } from 'vitest';

describe('RichTextSlots', () => {
  it('maps every pair tag to a slot with a `children` prop', () => {
    expectTypeOf<RichTextSlots<TReturn<'link', 'br'>>['link']>().toEqualTypeOf<
      (props: { children: () => VNodeChild[] }) => unknown
    >();
  });

  it('maps every void tag to a slot without props', () => {
    expectTypeOf<RichTextSlots<TReturn<'link', 'br'>>['br']>().toEqualTypeOf<
      (props: {}) => unknown
    >();
  });

  it('lists the source tags as slot names', () => {
    expectTypeOf<
      keyof RichTextSlots<TReturn<'link' | 'strong', 'br'>>
    >().toEqualTypeOf<'link' | 'strong' | 'br'>();
  });

  it('lists no slot names for a plain `string` source', () => {
    expectTypeOf<keyof RichTextSlots<string>>().toEqualTypeOf<never>();
  });
});
