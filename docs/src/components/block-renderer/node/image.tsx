import type { ImageBlock } from '#lib/content';

import { Box } from '#components/box';

export interface NodeImageProps {
  block: ImageBlock;
}

export function NodeImage(props: NodeImageProps) {
  const { block } = props;
  return (
    <Box
      alt={block.alt ?? ''}
      as="img"
      src={block.src}
    />
  );
}
