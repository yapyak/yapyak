import type { StrikethroughBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

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
