import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './menu-button.module.css';

export interface HeaderMenuButtonProps {
  open: boolean;
  onToggle: () => void;
}

export function HeaderMenuButton(props: HeaderMenuButtonProps) {
  const { open, onToggle } = props;
  return (
    <Box
      aria-expanded={open}
      aria-label={open ? t('Close menu') : t('Open menu')}
      as="button"
      className={styles.HeaderMenuButton}
      data-open={open}
      onClick={onToggle}
      type="button"
    >
      <Box className={styles.Line} />
      <Box className={styles.Line} />
    </Box>
  );
}
