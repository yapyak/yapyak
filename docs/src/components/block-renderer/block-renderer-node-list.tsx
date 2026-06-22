import type { ListBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-list.module.css';

export type BlockRendererNodeListProps = {
  block: ListBlock;
};

export function BlockRendererNodeList(props: BlockRendererNodeListProps) {
  const { block } = props;
  return (
    <Box
      as={block.ordered ? 'ol' : 'ul'}
      className={styles.BlockRendererNodeList}
      data-size={block.size}
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
