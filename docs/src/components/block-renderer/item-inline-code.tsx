import type { InlineCodeBlock } from '#lib/content';

import { Box } from '#components/box';

export interface ItemInlineCodeProps {
  block: InlineCodeBlock;
}

export function ItemInlineCode(props: ItemInlineCodeProps) {
  const { block } = props;
  return <Box as="code">{block.value}</Box>;
}
