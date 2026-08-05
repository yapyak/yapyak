import type { TableCellBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-table-cell.module.css';

export type BlockRendererNodeTableCellProps = BoxProps & {
  block: TableCellBlock;
};

export function BlockRendererNodeTableCell(
  props: BlockRendererNodeTableCellProps,
) {
  const { block, className } = props;

  return (
    <Box
      as={block.header ? 'th' : 'td'}
      className={[
        styles.BlockRendererNodeTableCell,
        className,
      ]}
      data-column={block.column}
      data-header={block.header}
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
