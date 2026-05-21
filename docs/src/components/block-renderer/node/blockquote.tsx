import type { BlockquoteBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeBlockquoteProps {
  block: BlockquoteBlock;
}

export function NodeBlockquote(props: NodeBlockquoteProps) {
  const { block } = props;
  return (
    <Box as="blockquote">
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
