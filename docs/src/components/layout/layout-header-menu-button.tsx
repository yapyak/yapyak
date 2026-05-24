import { $t } from '@yapyak/core';

import { Box } from '#components/box';

import styles from './layout-header-menu-button.module.css';

export interface LayoutHeaderMenuButtonProps {
  onToggle: () => void;
  open: boolean;
}

export function LayoutHeaderMenuButton(props: LayoutHeaderMenuButtonProps) {
  const { open, onToggle } = props;
  return (
    <Box
      aria-expanded={open}
      aria-label={open ? $t('Close menu') : $t('Open menu')}
      as="button"
      className={styles.LayoutHeaderMenuButton}
      data-open={open}
      onClick={onToggle}
      type="button"
    >
      <Box className={styles.Line} />
      <Box className={styles.Line} />
    </Box>
  );
}
