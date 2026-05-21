import type { InlineCodeBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import styles from './inline-code.module.css';

export interface NodeInlineCodeProps {
  block: InlineCodeBlock;
}

export function NodeInlineCode(props: NodeInlineCodeProps) {
  const { block } = props;
  return (
    <Box
      as="code"
      className={styles.InlineCode}
    >
      {block.value}
    </Box>
  );
}
