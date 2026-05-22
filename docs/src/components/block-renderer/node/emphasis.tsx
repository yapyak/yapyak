import type { EmphasisBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

import styles from './emphasis.module.css';

export interface NodeEmphasisProps {
  block: EmphasisBlock;
}

export function NodeEmphasis(props: NodeEmphasisProps) {
  const { block } = props;

  return (
    <Box
      as="em"
      className={styles.Emphasis}
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
