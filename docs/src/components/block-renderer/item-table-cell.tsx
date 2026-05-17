import type { TableCellBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemTableCellProps {
  block: TableCellBlock;
}

export function ItemTableCell(props: ItemTableCellProps) {
  const { block } = props;
  return (
    <Box as="td">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
