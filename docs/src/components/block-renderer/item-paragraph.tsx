import type { ParagraphBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemParagraphProps {
  block: ParagraphBlock;
}

export function ItemParagraph(props: ItemParagraphProps) {
  const { block } = props;
  return (
    <Box as="p">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
