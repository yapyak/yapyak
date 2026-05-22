import type { ListItemBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

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
