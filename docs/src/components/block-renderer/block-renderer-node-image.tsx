import type { ImageBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

export type BlockRendererNodeImageProps = BoxProps<'img'> & {
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
