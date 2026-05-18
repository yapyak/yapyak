import { t } from 'yapyak';

import { Box } from '#components/box';
import { ChevronIcon } from '#components/chevron-icon';

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
      <Box
        as="span"
        className={styles.LabelText}
      >
        {t('Sections')}
      </Box>
      <Box
        as="span"
        className={styles.ChevronWrapper}
      >
        <ChevronIcon direction="down" />
      </Box>
    </Box>
  );
}
