import type { TableRowBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeTableRowProps {
  block: TableRowBlock;
}

export function BlockRendererNodeTableRow(
  props: BlockRendererNodeTableRowProps,
) {
  const { block } = props;
  return (
    <Box as="tr">
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
