import type { InlineCodeBlock } from '#lib/content';

import { Box } from '#components/box';

export interface BlockRendererNodeInlineCodeProps {
  block: InlineCodeBlock;
}

export function BlockRendererNodeInlineCode(
  props: BlockRendererNodeInlineCodeProps,
) {
  const { block } = props;
  return <Box as="code">{block.value}</Box>;
}
