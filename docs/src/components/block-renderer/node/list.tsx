import type { ListBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';
import styles from './list.module.css';

export interface NodeListProps {
  block: ListBlock;
}

export function NodeList(props: NodeListProps) {
  const { block } = props;
  return (
    <Box
      as={block.ordered ? 'ol' : 'ul'}
      className={styles.List}
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
