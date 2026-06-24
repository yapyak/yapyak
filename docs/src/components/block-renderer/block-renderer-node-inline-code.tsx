import type { InlineCodeBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './block-renderer-node-inline-code.module.css';

export type BlockRendererNodeInlineCodeProps = BoxProps<'code'> & {
  block: InlineCodeBlock;
};

export function BlockRendererNodeInlineCode(
  props: BlockRendererNodeInlineCodeProps,
) {
  const { block, className, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="code"
      className={[
        styles.BlockRendererNodeInlineCode,
        className,
      ]}
    >
      {block.value}
    </Box>
  );
}
