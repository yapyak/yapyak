import type { FunctionalComponent, VNode } from 'vue';

import { h } from 'vue';
import {
  parseRichText,
  type RichTextNode as Node,
} from 'yapyak/internal';

/**
 * The shape of a slot exposed by {@link RichText}. Each named tag in the
 * source string surfaces as a scoped slot with this signature.
 *
 * The slot receives a `children` render function that emits the inner content,
 * which the consumer wraps in the desired element.
 */
export type TagSlot = (props: { children: () => VNode[] }) => VNode[];

/**
 * Slots exposed by {@link RichText}.
 *
 * @remarks
 * Vue's type system cannot require slots derived from a generic string literal,
 * so the slot map is open: any tag found in `value` can be supplied via a
 * scoped slot of the same name. A tag with no matching slot renders as literal
 * text.
 */
export type RichTextSlots = Record<string, TagSlot>;

/**
 * Props for {@link RichText}.
 *
 * @typeParam T - The source string literal. Tag names are extracted from it.
 */
export type RichTextProps<T extends string> = { value: T };

/**
 * Renders rich text from a string with named tags into scoped slots supplied
 * by the caller. See {@link RichTextSlots} for the slot signature.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { t } from 'yapyak';
 * import { RichText } from '@yapyak/vue';
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
export const RichText: FunctionalComponent<
  RichTextProps<string>,
  Record<string, never>,
  RichTextSlots
> = (props, context) => {
  return renderNodes(parseRichText(props.value), context.slots);
};

function renderNodes(
  nodes: Node[],
  slots: Readonly<Record<string, TagSlot | undefined>>,
): VNode[] {
  const out: VNode[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push(h('span', node.text) as VNode);
      continue;
    }
    const slot = slots[node.name];
    if (slot) {
      const children = (): VNode[] => renderNodes(node.children, slots);
      out.push(...slot({ children }));
      continue;
    }
    out.push(h('span', `<${node.name}>`) as VNode);
    out.push(...renderNodes(node.children, slots));
    out.push(h('span', `</${node.name}>`) as VNode);
  }
  return out;
}
