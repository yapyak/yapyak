import type { ListBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeListProps {
  block: ListBlock;
}

export function BlockRendererNodeList(props: BlockRendererNodeListProps) {
  const { block } = props;
  return (
    <Box as={block.ordered ? 'ol' : 'ul'}>
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
