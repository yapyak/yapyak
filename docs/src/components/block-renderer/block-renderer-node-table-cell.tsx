import type { TableCellBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-table-cell.module.css';

export interface BlockRendererNodeTableCellProps {
  block: TableCellBlock;
}

export function BlockRendererNodeTableCell(props: BlockRendererNodeTableCellProps) {
  const { block } = props;
  return (
    <Box
      as={block.header ? 'th' : 'td'}
      className={styles.BlockRendererNodeTableCell}
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
