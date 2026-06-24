import type { ParagraphBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeParagraphProps = BoxProps<'p'> & {
  block: ParagraphBlock;
};

export function BlockRendererNodeParagraph(
  props: BlockRendererNodeParagraphProps,
) {
  const { block, className, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="p"
    >
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
