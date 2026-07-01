import type { ListItemBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeListItemProps = BoxProps<'li'> & {
  block: ListItemBlock;
};

export function BlockRendererNodeListItem(
  props: BlockRendererNodeListItemProps,
) {
  const { block, className, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="li"
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
