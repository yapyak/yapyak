import type { LinkBlock } from '#lib/content';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeLinkProps {
  block: LinkBlock;
}

export function NodeLink(props: NodeLinkProps) {
  const { block } = props;
  const children = block.children.map((child, index) => (
    <BlockRendererNode
      block={child}
      key={index}
    />
  ));

  if (block.kind === 'internal') {
    return (
      <Box
        as={Link}
        to={block.href}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      as="a"
      href={block.href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </Box>
  );
}
