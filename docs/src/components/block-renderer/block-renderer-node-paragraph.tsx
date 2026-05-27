import type { ParagraphBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

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
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
