import type { TableBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemTableProps {
  block: TableBlock;
}

export function ItemTable(props: ItemTableProps) {
  const { block } = props;
  return (
    <Box as="table">
      {block.head && (
        <Box as="thead">
          <Item block={block.head} />
        </Box>
      )}
      <Box as="tbody">
        {block.body.map((row, index) => (
          <Item
            key={index}
            block={row}
          />
        ))}
      </Box>
    </Box>
  );
}
