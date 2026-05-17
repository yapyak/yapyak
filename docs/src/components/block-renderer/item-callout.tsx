import type { CalloutBlock } from '#lib/content';

import { Callout } from '#components/callout';

import { Item } from './item';

export interface ItemCalloutProps {
  block: CalloutBlock;
}

export function ItemCallout(props: ItemCalloutProps) {
  const { block } = props;
  return (
    <Callout
      title={block.title ?? undefined}
      variant={block.variant}
    >
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Callout>
  );
}
