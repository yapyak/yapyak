import type { TableBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

import styles from './table.module.css';

export interface NodeTableProps {
  block: TableBlock;
}

export function NodeTable(props: NodeTableProps) {
  const { block } = props;
  return (
    <Box
      as="table"
      className={styles.Table}
    >
      {block.head && (
        <Box as="thead">
          <BlockRendererNode block={block.head} />
        </Box>
      )}
      <Box as="tbody">
        {block.body.map((row, index) => (
          <BlockRendererNode
            block={row}
            key={index}
          />
        ))}
      </Box>
    </Box>
  );
}
