import type { LinkBlock } from '@yapyak/doc-extractor';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';
import styles from './link.module.css';

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
        className={styles.Link}
        to={block.href}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      as="a"
      className={styles.Link}
      href={block.href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </Box>
  );
}
