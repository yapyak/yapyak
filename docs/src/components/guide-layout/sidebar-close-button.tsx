import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './sidebar-close-button.module.css';

export interface GuideLayoutSidebarCloseButtonProps {
  onClick: () => void;
}

export function GuideLayoutSidebarCloseButton(
  props: GuideLayoutSidebarCloseButtonProps,
) {
  const { onClick } = props;
  return (
    <Box
      aria-label={t('Close sections')}
      as="button"
      className={styles.GuideLayoutSidebarCloseButton}
      onClick={onClick}
      type="button"
    >
      <Box className={styles.Line} />
      <Box className={styles.Line} />
    </Box>
  );
}
