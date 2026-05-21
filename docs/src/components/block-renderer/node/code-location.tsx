import type { CodeLocationBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import styles from './code-location.module.css';

export interface NodeCodeLocationProps {
  block: CodeLocationBlock;
}

export function NodeCodeLocation(props: NodeCodeLocationProps) {
  const { block } = props;
  const label = `${block.file}:${block.line}`;
  if (block.href !== null) {
    return (
      <Box
        as="a"
        className={styles.CodeLocation}
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
      className={styles.CodeLocation}
    >
      {label}
    </Box>
  );
}
