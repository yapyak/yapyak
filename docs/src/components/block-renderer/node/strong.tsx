import type { StrongBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeStrongProps {
  block: StrongBlock;
}

export function NodeStrong(props: NodeStrongProps) {
  const { block } = props;
  return (
    <Box as="strong">
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
