import type { EyebrowBlock } from '#lib/content';

import { Box } from '#components/box';

import { KindBadge } from './eyebrow/kind-badge';

import styles from './eyebrow.module.css';

export interface NodeEyebrowProps {
  block: EyebrowBlock;
}

export function NodeEyebrow(props: NodeEyebrowProps) {
  const { block } = props;
  return (
    <Box
      as="p"
      className={styles.Eyebrow}
    >
      <KindBadge variant={block.kind} />
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
