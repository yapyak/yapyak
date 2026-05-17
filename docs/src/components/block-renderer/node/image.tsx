import type { ImageBlock } from '#lib/content';

import { Box } from '#components/box';

export interface BlockRendererNodeImageProps {
  block: ImageBlock;
}

export function BlockRendererNodeImage(props: BlockRendererNodeImageProps) {
  const { block } = props;
  return (
    <Box
      alt={block.alt ?? ''}
      as="img"
      src={block.src}
    />
  );
}
