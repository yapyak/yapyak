import type { QuoteBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

export interface NodeQuoteProps {
  block: QuoteBlock;
}

export function NodeQuote(props: NodeQuoteProps) {
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
