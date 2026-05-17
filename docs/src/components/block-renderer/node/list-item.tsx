import type { ListItemBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeListItemProps {
  block: ListItemBlock;
}

export function NodeListItem(
  props: NodeListItemProps,
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
