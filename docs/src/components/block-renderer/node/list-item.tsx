import type { ListItemBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeListItemProps {
  block: ListItemBlock;
}

export function BlockRendererNodeListItem(
  props: BlockRendererNodeListItemProps,
) {
  const { block } = props;
  return (
    <Box as="li">
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
