import type { Block } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './block-renderer.module.css';
import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererProps = BoxProps & {
  blocks: Block[];
};

export function BlockRenderer(props: BlockRendererProps) {
  const { blocks, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.BlockRenderer,
        className,
      ]}
    >
      {blocks.map((block, index) => (
        <BlockRendererNode
          block={block}
          key={index}
        />
      ))}
    </Box>
  );
}
