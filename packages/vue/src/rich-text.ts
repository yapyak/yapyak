import type { FunctionalComponent, VNodeChild } from 'vue';
import type { RichTextNode as Node } from 'yapyak/internal';

import { parseRichText } from 'yapyak/internal';

/**
 * The pair-tag slot. Each named pair tag (`<name>...</name>`) in the source string surfaces as a scoped slot with this signature.
 *
 * @remarks
 * The slot receives a `children` render function that emits the inner content, which the consumer wraps in the desired element.
 */
export type TagSlot = (props: { children: () => VNodeChild[] }) => VNodeChild[];

/**
 * The void-tag slot. Each named void tag (`<name/>`) in the source string surfaces as a slot with this signature.
 *
 * @remarks
 * The slot receives no scope props. The consumer renders the standalone element.
 */
export type VoidSlot = () => VNodeChild[];

/**
 * The rich-text slots. Maps tag names to their {@link TagSlot} or {@link VoidSlot}.
 *
 * @remarks
 * Vue's type system cannot require slots derived from a generic string literal, so the slot map is open: any tag found in `value` is matched against a slot of the same name. A tag with no matching slot renders as literal text.
 */
export type RichTextSlots = Record<string, TagSlot | VoidSlot>;

/**
 * Props for {@link RichText}.
 *
 * @typeParam T - The source string literal carrying the tag names.
 */
export type RichTextProps<T extends string> = {
  value: T;
};

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
 *
 * @example Void tag for a line break
 * ```vue
 * <RichText :value="t('Line one<br/>line two')">
 *   <template #br>
 *     <br/>
 *   </template>
 * </RichText>
 * ```
 */
export const RichText: FunctionalComponent<
  RichTextProps<string>,
  Record<string, never>,
  RichTextSlots
> = (props, context) => renderNodes(parseRichText(props.value), context.slots);

function renderNodes(
  nodes: Node[],
  slots: Readonly<Record<string, TagSlot | VoidSlot | undefined>>,
): VNodeChild[] {
  const out: VNodeChild[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push(node.text);
      continue;
    }
    if (node.type === 'void') {
      const slot = slots[node.name];
      if (slot) {
        out.push(...(slot as VoidSlot)());
        continue;
      }
      out.push(`<${node.name}/>`);
      continue;
    }
    const slot = slots[node.name];
    if (slot) {
      const children = (): VNodeChild[] => renderNodes(node.children, slots);
      out.push(
        ...(slot as TagSlot)({
          children,
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
