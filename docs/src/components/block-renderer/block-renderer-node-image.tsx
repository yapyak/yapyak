import type { ImageBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';

export type BlockRendererNodeImageProps = {
  block: ImageBlock;
};

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
