import type { TableBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-table.module.css';

export type BlockRendererNodeTableProps = BoxProps<'table'> & {
  block: TableBlock;
};

export function BlockRendererNodeTable(props: BlockRendererNodeTableProps) {
  const { block, className, ...restProps } = props;

  return (
    <Box
      className={[
        styles.BlockRendererNodeTable,
        className,
      ]}
    >
      <Box
        {...restProps}
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
    </Box>
  );
}
