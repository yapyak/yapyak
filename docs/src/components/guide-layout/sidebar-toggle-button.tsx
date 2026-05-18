import { Box } from '#components/box';
import { SectionsIcon } from '#components/sections-icon';
import { t } from 'yapyak';

import { useGuideLayout } from '../guide-layout';
import styles from './sidebar-toggle-button.module.css';

export interface GuideLayoutSidebarToggleButtonProps {}

export function GuideLayoutSidebarToggleButton(
  _props: GuideLayoutSidebarToggleButtonProps,
) {
  const { openSidebar } = useGuideLayout();
  return (
    <Box
      aria-label={t('Open sections')}
      as="button"
      className={styles.GuideLayoutSidebarToggleButton}
      onClick={openSidebar}
      type="button"
    >
      <SectionsIcon />
    </Box>
  );
}
