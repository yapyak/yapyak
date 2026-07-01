import type { ListBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-list.module.css';

export type BlockRendererNodeListProps = BoxProps & {
  block: ListBlock;
};

export function BlockRendererNodeList(props: BlockRendererNodeListProps) {
  const { block, className } = props;
  return (
    <Box
      as={block.ordered ? 'ol' : 'ul'}
      className={[
        styles.BlockRendererNodeList,
        className,
      ]}
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
