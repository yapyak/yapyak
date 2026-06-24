import type { TableCellBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-table-cell.module.css';

export type BlockRendererNodeTableCellProps = BoxProps & {
  block: TableCellBlock;
};

export function BlockRendererNodeTableCell(
  props: BlockRendererNodeTableCellProps,
) {
  const { block, className, ...restProps } = props;

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
