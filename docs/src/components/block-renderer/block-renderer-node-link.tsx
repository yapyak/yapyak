import type { LinkBlock } from '@yapyak/doc-compiler';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-link.module.css';

export type BlockRendererNodeLinkProps = {
  block: LinkBlock;
};

export function BlockRendererNodeLink(props: BlockRendererNodeLinkProps) {
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
        className={styles.BlockRendererNodeLink}
        to={block.href}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      as="a"
      className={styles.BlockRendererNodeLink}
      href={block.href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </Box>
  );
}
