import type { StrikethroughBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemStrikethroughProps {
  block: StrikethroughBlock;
}

export function ItemStrikethrough(props: ItemStrikethroughProps) {
  const { block } = props;
  return (
    <Box as="s">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
