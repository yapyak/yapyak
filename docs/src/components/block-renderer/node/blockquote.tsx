import type { BlockquoteBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeBlockquoteProps {
  block: BlockquoteBlock;
}

export function BlockRendererNodeBlockquote(
  props: BlockRendererNodeBlockquoteProps,
) {
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
