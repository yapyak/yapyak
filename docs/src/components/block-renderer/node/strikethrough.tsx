import type { StrikethroughBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

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
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
