import type { BoxProps } from '#primitives/box';

import { t } from 'yapyak';

import { Box } from '#primitives/box';

import styles from './layout-header-menu-button.module.css';

export type LayoutHeaderMenuButtonProps = BoxProps<'button'> & {
  onToggle: () => void;
  open: boolean;
};

export function LayoutHeaderMenuButton(props: LayoutHeaderMenuButtonProps) {
  const { className, open, onToggle, ...restProps } = props;
  return (
    <Box
      {...restProps}
      aria-expanded={open}
      aria-label={open ? t('Close menu') : t('Open menu')}
      as="button"
      className={[
        styles.LayoutHeaderMenuButton,
        className,
      ]}
      data-open={open}
      onClick={onToggle}
      type="button"
    >
      <Box className={styles.Line} />
      <Box className={styles.Line} />
    </Box>
  );
}
