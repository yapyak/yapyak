import type { ImageBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

export type BlockRendererNodeImageProps = BoxProps<'img'> & {
  block: ImageBlock;
};

export function BlockRendererNodeImage(props: BlockRendererNodeImageProps) {
  const { block, className, ...restProps } = props;
  return (
    <Box
      alt={block.alt ?? ''}
      as="img"
      src={block.src}
    />
  );
}
