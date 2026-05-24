import type { EmphasisBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-emphasis.module.css';

export interface BlockRendererNodeEmphasisProps {
  block: EmphasisBlock;
}

export function BlockRendererNodeEmphasis(
  props: BlockRendererNodeEmphasisProps,
) {
  const { block } = props;

  return (
    <Box
      as="em"
      className={styles.BlockRendererNodeEmphasis}
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
