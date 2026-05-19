import type { SourceLinkBlock } from '#lib/content';

import { Box } from '#components/box';

import styles from './source-link.module.css';

export interface NodeSourceLinkProps {
  block: SourceLinkBlock;
}

export function NodeSourceLink(props: NodeSourceLinkProps) {
  const { block } = props;
  const label = `${block.file}:${block.line}`;
  if (block.href !== null) {
    return (
      <Box
        as="a"
        className={styles.SourceLink}
        href={block.href}
        rel="noreferrer"
        target="_blank"
      >
        {label}
      </Box>
    );
  }
  return (
    <Box
      as="span"
      className={styles.SourceLink}
    >
      {label}
    </Box>
  );
}
