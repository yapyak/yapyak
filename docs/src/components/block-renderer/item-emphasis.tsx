import type { EmphasisBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemEmphasisProps {
  block: EmphasisBlock;
}

export function ItemEmphasis(props: ItemEmphasisProps) {
  const { block } = props;
  return (
    <Box as="em">
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
