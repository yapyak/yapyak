import type { StrongBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-strong.module.css';

export interface BlockRendererNodeStrongProps {
  block: StrongBlock;
}

export function BlockRendererNodeStrong(props: BlockRendererNodeStrongProps) {
  const { block } = props;
  return (
    <Box
      as="strong"
      className={styles.BlockRendererNodeStrong}
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
