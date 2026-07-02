import type { TableRowBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-table-row.module.css';

export type BlockRendererNodeTableRowProps = BoxProps<'tr'> & {
  block: TableRowBlock;
};

export function BlockRendererNodeTableRow(
  props: BlockRendererNodeTableRowProps,
) {
  const { block, className, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="tr"
      className={[
        styles.BlockRendererNodeTableRow,
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
