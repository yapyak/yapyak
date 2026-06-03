import type { CodeLocationBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import styles from './block-renderer-node-code-location.module.css';

export interface BlockRendererNodeCodeLocationProps {
  block: CodeLocationBlock;
}

export function BlockRendererNodeCodeLocation(
  props: BlockRendererNodeCodeLocationProps,
) {
  const { block } = props;
  if (block.href !== null) {
    return (
      <Box
        as="a"
        className={styles.BlockRendererNodeCodeLocation}
        href={block.href}
        rel="noreferrer"
        target="_blank"
      >
        GitHub
      </Box>
    );
  }
  return (
    <Box
      as="span"
      className={styles.BlockRendererNodeCodeLocation}
    >
      {`${block.file}:${block.line}`}
    </Box>
  );
}
