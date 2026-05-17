import type { LinkBlock } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './item';

export interface ItemLinkProps {
  block: LinkBlock;
}

export function ItemLink(props: ItemLinkProps) {
  const { block } = props;
  return (
    <Box
      as="a"
      href={block.href}
    >
      {block.children.map((child, index) => (
        <Item
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
