import type { ListBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-list.module.css';

export interface BlockRendererNodeListProps {
  block: ListBlock;
}

export function BlockRendererNodeList(props: BlockRendererNodeListProps) {
  const { block } = props;
  return (
    <Box
      as={block.ordered ? 'ol' : 'ul'}
      className={styles.BlockRendererNodeList}
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
