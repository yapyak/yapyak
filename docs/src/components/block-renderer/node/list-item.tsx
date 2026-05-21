import type { ListItemBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeListItemProps {
  block: ListItemBlock;
}

export function NodeListItem(props: NodeListItemProps) {
  const { block } = props;
  return (
    <Box as="li">
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
