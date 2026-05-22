import type { TableRowBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

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
