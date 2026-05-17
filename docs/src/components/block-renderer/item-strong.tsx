import type { StrongBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemStrongProps {
  block: StrongBlock;
}

export function ItemStrong(props: ItemStrongProps) {
  const { block } = props;
  return (
    <Box as="strong">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
