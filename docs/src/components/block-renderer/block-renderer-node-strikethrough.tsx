import type { StrikethroughBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeStrikethroughProps = BoxProps<'s'> & {
  block: StrikethroughBlock;
};

export function BlockRendererNodeStrikethrough(
  props: BlockRendererNodeStrikethroughProps,
) {
  const { block, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="s"
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
