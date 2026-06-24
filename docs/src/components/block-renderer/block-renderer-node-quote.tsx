import type { QuoteBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeQuoteProps = BoxProps<'blockquote'> & {
  block: QuoteBlock;
};

export function BlockRendererNodeQuote(props: BlockRendererNodeQuoteProps) {
  const { block, className, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="blockquote"
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
