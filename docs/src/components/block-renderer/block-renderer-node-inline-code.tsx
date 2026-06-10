import type { InlineCodeBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import styles from './block-renderer-node-inline-code.module.css';

export type BlockRendererNodeInlineCodeProps = {
  block: InlineCodeBlock;
};

export function BlockRendererNodeInlineCode(
  props: BlockRendererNodeInlineCodeProps,
) {
  const { block } = props;
  return (
    <Box
      as="code"
      className={styles.BlockRendererNodeInlineCode}
    >
      {block.value}
    </Box>
  );
}
