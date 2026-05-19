import type { TableCellBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeTableCellProps {
  block: TableCellBlock;
}

export function NodeTableCell(props: NodeTableCellProps) {
  const { block } = props;
  return (
    <Box as={block.header ? 'th' : 'td'}>
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
