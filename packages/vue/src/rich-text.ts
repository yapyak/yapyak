import type { FunctionalComponent, VNodeChild } from 'vue';
import type { RichTextNode as Node } from 'yapyak/internal';

import { parseRichText } from 'yapyak/internal';

/**
 * The tag slot. Each named tag in the source string surfaces as a scoped slot with this signature.
 *
 * @remarks
 * The slot receives a `children` render function that emits the inner content, which the consumer wraps in the desired element.
 */
export type TagSlot = (props: { children: () => VNodeChild[] }) => VNodeChild[];

/**
 * The rich-text slots. Maps tag names to their {@link TagSlot}.
 *
 * @remarks
 * Vue's type system cannot require slots derived from a generic string literal, so the slot map is open: any tag found in `value` is matched against a scoped slot of the same name. A tag with no matching slot renders as literal text.
 */
export type RichTextSlots = Record<string, TagSlot>;

/**
 * Props for {@link RichText}.
 *
 * @typeParam T - The source string literal carrying the tag names.
 */
export type RichTextProps<T extends string> = { value: T };

/**
 * Renders rich text by resolving named tags via scoped slots.
 *
 * @remarks
 * The slot shape is {@link RichTextSlots}.
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
