import type { TableBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeTableProps {
  block: TableBlock;
}

export function NodeTable(props: NodeTableProps) {
  const { block } = props;
  return (
    <Box as="table">
      {block.head && (
        <Box as="thead">
          <BlockRendererNode block={block.head} />
        </Box>
      )}
      <Box as="tbody">
        {block.body.map((row, index) => (
          <BlockRendererNode
            key={index}
            block={row}
          />
        ))}
      </Box>
    </Box>
  );
}
