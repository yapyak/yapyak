import type { BlockquoteBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemBlockquoteProps {
  block: BlockquoteBlock;
}

export function ItemBlockquote(props: ItemBlockquoteProps) {
  const { block } = props;
  return (
    <Box as="blockquote">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
