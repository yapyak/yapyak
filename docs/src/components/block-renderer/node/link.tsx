import type { LinkBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeLinkProps {
  block: LinkBlock;
}

export function BlockRendererNodeLink(props: BlockRendererNodeLinkProps) {
  const { block } = props;
  return (
    <Box
      as="a"
      href={block.href}
    >
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
