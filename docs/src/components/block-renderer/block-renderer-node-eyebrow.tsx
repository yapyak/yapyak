import type { EyebrowBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNodeEyebrowKindBadge } from './block-renderer-node-eyebrow-kind-badge';
import styles from './block-renderer-node-eyebrow.module.css';

export interface BlockRendererNodeEyebrowProps {
  block: EyebrowBlock;
}

export function BlockRendererNodeEyebrow(props: BlockRendererNodeEyebrowProps) {
  const { block } = props;
  return (
    <Box
      as="p"
      className={styles.BlockRendererNodeEyebrow}
    >
      <BlockRendererNodeEyebrowKindBadge variant={block.kind} />
      {block.module && (
        <Box
          as="span"
          className={styles.ModuleText}
        >
          {block.module}
        </Box>
      )}
    </Box>
  );
}
