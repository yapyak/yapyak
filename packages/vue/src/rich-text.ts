import type { PublicProps, VNodeChild } from 'vue';
import type { RichTextNode, TReturn } from 'yapyak';

import { parseRichText } from 'yapyak';

type PairsOf<T> =
  T extends TReturn<infer Pair extends string, string> ? Pair : never;
type VoidsOf<T> =
  T extends TReturn<string, infer Void extends string> ? Void : never;

type SlotFn = (props: { children: () => VNodeChild[] }) => VNodeChild[];

/**
 * Props for {@link RichText}.
 *
 * @typeParam T - The source string literal.
 */
export type RichTextProps<T extends string> = {
  /** The source string. */
  value: T;
};

/**
 * Slots for {@link RichText}.
 *
 * @shape RichTextSlots<T extends string> = \{
 *   [pairTag]: (props: \{ children: () => VNodeChild[] \}) => unknown,
 *   [voidTag]: (props: \{\}) => unknown,
 * \}
 *
 * @typeParam T - The source string literal.
 */
export type RichTextSlots<T extends string> = {
  [Pair in PairsOf<T>]: (props: { children: () => VNodeChild[] }) => unknown;
} & {
  [Void in VoidsOf<T>]: (props: {}) => unknown;
};

type RichTextContext<T extends string> = {
  attrs: Record<string, unknown>;
  emit: Record<string, never>;
  props: PublicProps & RichTextProps<T>;
  slots: RichTextSlots<T>;
};

type RichTextComponent = <T extends string>(
  props: RichTextContext<T>['props'],
  context?: Pick<RichTextContext<T>, 'attrs' | 'emit' | 'slots'>,
) => VNodeChild[] & {
  __ctx?: RichTextContext<T>;
};

/**
 * Renders rich text by binding each named tag to a named slot.
 *
 * @example
 * ```vue
 * <script setup>
 *   import { RichText } from '@yapyak/vue';
 *   import { t } from 'yapyak';
 * </script>
 *
 * <template>
 *   <RichText :value="t('Click <link>here</link>.')">
 *     <template #link="{ children }">
 *       <a href="/docs"><component :is="children" /></a>
 *     </template>
 *   </RichText>
 * </template>
 * ```
 */
export const RichText: RichTextComponent = (props, context) =>
  renderNodes(
    parseRichText(props.value),
    (context?.slots ?? {}) as Readonly<Record<string, SlotFn | undefined>>,
  );

function renderNodes(
  nodes: RichTextNode[],
  slots: Readonly<Record<string, SlotFn | undefined>>,
): VNodeChild[] {
  const out: VNodeChild[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push(node.value);
      continue;
    }
    if (node.type === 'void') {
      const slot = slots[node.name];
      if (slot) {
        out.push(
          ...slot({
            children: () => [],
          }),
        );
        continue;
      }
      out.push(`<${node.name}/>`);
      continue;
    }
    const slot = slots[node.name];
    if (slot) {
      const renderChildren = (): VNodeChild[] =>
        renderNodes(node.children, slots);
      out.push(
        ...slot({
          children: renderChildren,
        }),
      );
      continue;
    }
    out.push(`<${node.name}>`);
    out.push(...renderNodes(node.children, slots));
    out.push(`</${node.name}>`);
  }
  return out;
}
