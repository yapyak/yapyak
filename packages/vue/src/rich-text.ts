import type { FunctionalComponent, VNodeChild } from 'vue';

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
export type TagSlot = (props: { children: () => VNodeChild[] }) => VNodeChild[];

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
 * by the caller. See {@link RichTextSlots} for the slot shape.
 *
 * @example
 * ```vue
 * <RichText :value="t('Click <link>here</link>.')">
 *   <template #link="{ children }">
 *     <a href="/docs"><component :is="children" /></a>
 *   </template>
 * </RichText>
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
): VNodeChild[] {
  const out: VNodeChild[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push(node.text);
      continue;
    }
    const slot = slots[node.name];
    if (slot) {
      const children = (): VNodeChild[] => renderNodes(node.children, slots);
      out.push(...slot({ children }));
      continue;
    }
    out.push(`<${node.name}>`);
    out.push(...renderNodes(node.children, slots));
    out.push(`</${node.name}>`);
  }
  return out;
}
