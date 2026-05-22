import type { CodeLocationBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import styles from './block-renderer-node-code-location.module.css';

export interface BlockRendererNodeCodeLocationProps {
  block: CodeLocationBlock;
}

export function BlockRendererNodeCodeLocation(props: BlockRendererNodeCodeLocationProps) {
  const { block } = props;
  const label = `${block.file}:${block.line}`;
  if (block.href !== null) {
    return (
      <Box
        as="a"
        className={styles.BlockRendererNodeCodeLocation}
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
      className={styles.BlockRendererNodeCodeLocation}
    >
      {label}
    </Box>
  );
}
