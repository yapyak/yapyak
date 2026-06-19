import type { TableRowBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeTableRowProps = {
  block: TableRowBlock;
};

export function BlockRendererNodeTableRow(
  props: BlockRendererNodeTableRowProps,
) {
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
