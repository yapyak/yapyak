import { Box } from '#components/box';

import styles from './menu-button.module.css';

export interface HeaderMenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function HeaderMenuButton(props: HeaderMenuButtonProps) {
  const { isOpen, onToggle } = props;
  return (
    <Box
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      as="button"
      className={styles.HeaderMenuButton}
      data-open={isOpen}
      onClick={onToggle}
      type="button"
    >
      <Box className={styles.Line} />
      <Box className={styles.Line} />
    </Box>
  );
}
