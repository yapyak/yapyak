import type { FunctionalComponent, VNodeChild } from 'vue';
import type { RichTextNode as Node } from 'yapyak/internal';

import { parseRichText } from 'yapyak/internal';

type PairSlot = (props: { children: () => VNodeChild[] }) => VNodeChild[];

type VoidSlot = () => VNodeChild[];

type RichTextSlots = Record<string, PairSlot | VoidSlot>;

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
  slots: Readonly<Record<string, PairSlot | VoidSlot | undefined>>,
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
        ...(slot as PairSlot)({
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
