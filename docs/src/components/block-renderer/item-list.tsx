import type { ListBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemListProps {
  block: ListBlock;
}

export function ItemList(props: ItemListProps) {
  const { block } = props;
  return (
    <Box as={block.ordered ? 'ol' : 'ul'}>
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
