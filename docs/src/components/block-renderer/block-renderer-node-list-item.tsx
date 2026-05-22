import type { ListItemBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

export interface BlockRendererNodeListItemProps {
  block: ListItemBlock;
}

export function BlockRendererNodeListItem(props: BlockRendererNodeListItemProps) {
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
