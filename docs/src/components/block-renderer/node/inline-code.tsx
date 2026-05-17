import type { InlineCodeBlock } from '#lib/content';

import { Box } from '#components/box';

export interface NodeInlineCodeProps {
  block: InlineCodeBlock;
}

export function NodeInlineCode(
  props: NodeInlineCodeProps,
) {
  const { block } = props;
  return <Box as="code">{block.value}</Box>;
}
