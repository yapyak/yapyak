import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './sidebar-toggle-button.module.css';

export interface GuideLayoutSidebarToggleButtonProps {
  onClick: () => void;
}

export function GuideLayoutSidebarToggleButton(
  props: GuideLayoutSidebarToggleButtonProps,
) {
  const { onClick } = props;
  return (
    <Box
      as="button"
      className={styles.GuideLayoutSidebarToggleButton}
      onClick={onClick}
      type="button"
    >
      {t('Sections')}
    </Box>
  );
}
