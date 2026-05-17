import type { TableHeaderCellBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemTableHeaderCellProps {
  block: TableHeaderCellBlock;
}

export function ItemTableHeaderCell(props: ItemTableHeaderCellProps) {
  const { block } = props;
  return (
    <Box as="th">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
