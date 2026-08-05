import type { ParagraphBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

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
