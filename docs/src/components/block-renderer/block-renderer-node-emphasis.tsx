import type { EmphasisBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-emphasis.module.css';

export type BlockRendererNodeEmphasisProps = BoxProps<'em'> & {
  block: EmphasisBlock;
};

export function BlockRendererNodeEmphasis(
  props: BlockRendererNodeEmphasisProps,
) {
  const { block, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="em"
      className={[
        styles.BlockRendererNodeEmphasis,
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
