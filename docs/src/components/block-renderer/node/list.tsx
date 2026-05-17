import type { ListBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeListProps {
  block: ListBlock;
}

export function NodeList(props: NodeListProps) {
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
