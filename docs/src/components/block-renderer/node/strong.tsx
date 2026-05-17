import type { StrongBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeStrongProps {
  block: StrongBlock;
}

export function BlockRendererNodeStrong(props: BlockRendererNodeStrongProps) {
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
