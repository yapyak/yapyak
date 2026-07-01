import type { StrongBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-strong.module.css';

export type BlockRendererNodeStrongProps = BoxProps<'strong'> & {
  block: StrongBlock;
};

export function BlockRendererNodeStrong(props: BlockRendererNodeStrongProps) {
  const { block, className, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="strong"
      className={[
        styles.BlockRendererNodeStrong,
        className,
      ]}
    >
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
