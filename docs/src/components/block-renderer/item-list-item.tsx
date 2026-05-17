import type { ListItemBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemListItemProps {
  block: ListItemBlock;
}

export function ItemListItem(props: ItemListItemProps) {
  const { block } = props;
  return (
    <Box as="li">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
