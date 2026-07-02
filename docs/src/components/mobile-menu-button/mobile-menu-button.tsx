import type { ButtonBaseProps } from '#primitives/button';

import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './mobile-menu-button.module.css';

export type MobileMenuButtonProps = ButtonBaseProps & {
  onToggle: () => void;
  open: boolean;
};

export function MobileMenuButton(props: MobileMenuButtonProps) {
  const { className, open, onToggle, ...restProps } = props;

  return (
    <ButtonBase
      {...restProps}
      aria-expanded={open}
      aria-label={open ? t('Close menu') : t('Open menu')}
      className={[
        styles.MobileMenuButton,
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
