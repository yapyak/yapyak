import type { StrikethroughBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

export interface BlockRendererNodeStrikethroughProps {
  block: StrikethroughBlock;
}

export function BlockRendererNodeStrikethrough(
  props: BlockRendererNodeStrikethroughProps,
) {
  const { block } = props;
  return (
    <Box as="s">
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
