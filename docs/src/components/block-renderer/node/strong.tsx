import type { StrongBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';
import styles from './strong.module.css';

export interface NodeStrongProps {
  block: StrongBlock;
}

export function NodeStrong(props: NodeStrongProps) {
  const { block } = props;
  return (
    <Box
      as="strong"
      className={styles.Strong}
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
