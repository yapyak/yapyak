import type { TableBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-table.module.css';

export interface BlockRendererNodeTableProps {
  block: TableBlock;
}

export function BlockRendererNodeTable(props: BlockRendererNodeTableProps) {
  const { block } = props;
  return (
    <Box
      as="table"
      className={styles.BlockRendererNodeTable}
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
