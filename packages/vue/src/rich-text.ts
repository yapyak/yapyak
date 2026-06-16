import type { FunctionalComponent, VNodeChild } from 'vue';
import type { RichTextNode } from 'yapyak/internal';

import { parseRichText } from 'yapyak/internal';

type SlotFn = (props: { children: () => VNodeChild[] }) => VNodeChild[];

type RichTextSlots = Record<string, SlotFn>;

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
 * Every named tag in `value` is bound to a slot of the same name. The slot receives a `children` thunk — for pair tags it renders the resolved inner content, for void tags it returns an empty array. Void-tag slots typically ignore `children` entirely.
 *
 * @example Pair tag with rendered children
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
  nodes: RichTextNode[],
  slots: Readonly<Record<string, SlotFn | undefined>>,
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
      const children = (): VNodeChild[] => renderNodes(node.children, slots);
      out.push(
        ...slot({
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
