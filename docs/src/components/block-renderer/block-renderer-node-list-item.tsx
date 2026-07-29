import type { ListItemBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-list-item.module.css';

export type BlockRendererNodeListItemProps = BoxProps<'li'> & {
  block: ListItemBlock;
};

export function BlockRendererNodeListItem(
  props: BlockRendererNodeListItemProps,
) {
  const { block, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="li"
      className={[
        styles.BlockRendererNodeListItem,
        className,
      ]}
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
