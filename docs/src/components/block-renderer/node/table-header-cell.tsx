import type { TableHeaderCellBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeTableHeaderCellProps {
  block: TableHeaderCellBlock;
}

export function NodeTableHeaderCell(
  props: NodeTableHeaderCellProps,
) {
  const { block } = props;
  return (
    <Box as="th">
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
