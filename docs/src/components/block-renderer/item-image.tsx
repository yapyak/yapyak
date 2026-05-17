import type { ImageBlock } from '#lib/content';

import { Box } from '#components/box';

export interface ItemImageProps {
  block: ImageBlock;
}

export function ItemImage(props: ItemImageProps) {
  const { block } = props;
  return (
    <Box
      alt={block.alt ?? ''}
      as="img"
      src={block.src}
    />
  );
}
