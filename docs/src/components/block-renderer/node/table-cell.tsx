import type { TableCellBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

import styles from './table-cell.module.css';

export interface NodeTableCellProps {
  block: TableCellBlock;
}

export function NodeTableCell(props: NodeTableCellProps) {
  const { block } = props;
  return (
    <Box
      as={block.header ? 'th' : 'td'}
      className={styles.TableCell}
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
