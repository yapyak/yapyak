import type { StrikethroughBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeStrikethroughProps {
  block: StrikethroughBlock;
}

export function NodeStrikethrough(props: NodeStrikethroughProps) {
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
