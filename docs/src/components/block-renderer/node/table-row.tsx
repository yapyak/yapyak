import type { TableRowBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeTableRowProps {
  block: TableRowBlock;
}

export function NodeTableRow(props: NodeTableRowProps) {
  const { block } = props;
  return (
    <Box as="tr">
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
