import type { StrikethroughBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeStrikethroughProps = {
  block: StrikethroughBlock;
};

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
