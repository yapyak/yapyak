import type { LinkBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeLinkProps {
  block: LinkBlock;
}

export function NodeLink(props: NodeLinkProps) {
  const { block } = props;
  return (
    <Box
      as="a"
      href={block.href}
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
