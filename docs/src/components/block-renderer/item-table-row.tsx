import type { TableRowBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemTableRowProps {
  block: TableRowBlock;
}

export function ItemTableRow(props: ItemTableRowProps) {
  const { block } = props;
  return (
    <Box as="tr">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
