import type { LinkBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';
import { ExternalLink } from '#components/external-link';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-link.module.css';

export type BlockRendererNodeLinkProps = BoxProps & {
  block: LinkBlock;
};

export function BlockRendererNodeLink(props: BlockRendererNodeLinkProps) {
  const { block, className } = props;
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
        className={[
          styles.BlockRendererNodeLink,
          className,
        ]}
        to={block.href}
      >
        {children}
      </Box>
    );
  }

  return <ExternalLink href={block.href}>{children}</ExternalLink>;
}
