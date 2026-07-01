import type { ButtonBaseProps } from '#primitives/button';

import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './layout-header-menu-button.module.css';

export type LayoutHeaderMenuButtonProps = ButtonBaseProps & {
  onToggle: () => void;
  open: boolean;
};

export function LayoutHeaderMenuButton(props: LayoutHeaderMenuButtonProps) {
  const { className, open, onToggle, ...restProps } = props;
  return (
    <ButtonBase
      {...restProps}
      aria-expanded={open}
      aria-label={open ? t('Close menu') : t('Open menu')}
      className={[
        styles.LayoutHeaderMenuButton,
        className,
      ]}
      data-open={open}
      onClick={onToggle}
    >
      <Box className={styles.Line} />
      <Box className={styles.Line} />
    </ButtonBase>
  );
}
