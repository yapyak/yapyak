import { Box } from '#primitives/box';

import styles from './block-renderer-node-divider.module.css';

export function BlockRendererNodeDivider() {
  return (
    <Box
      as="hr"
      className={styles.BlockRendererNodeDivider}
    />
  );
}
