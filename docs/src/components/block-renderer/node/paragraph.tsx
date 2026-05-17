import type { ParagraphBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeParagraphProps {
  block: ParagraphBlock;
}

export function BlockRendererNodeParagraph(
  props: BlockRendererNodeParagraphProps,
) {
  const { block } = props;
  return (
    <Box as="p">
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
