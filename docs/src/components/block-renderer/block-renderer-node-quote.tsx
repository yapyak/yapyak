import type { QuoteBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeQuoteProps = {
  block: QuoteBlock;
};

export function BlockRendererNodeQuote(props: BlockRendererNodeQuoteProps) {
  const { block } = props;
  return (
    <Box as="blockquote">
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
