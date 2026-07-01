import type { ReactNode } from 'react';
import type { ButtonBaseProps } from '#primitives/button';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './icon-button.module.css';

export type IconButtonIconPosition = 'leading' | 'trailing';

export type IconButtonProps = ButtonBaseProps & {
  icon: ReactNode;
  iconPosition?: IconButtonIconPosition;
};

export function IconButton(props: IconButtonProps) {
  const {
    children,
    className,
    icon,
    iconPosition = 'leading',
    ...restProps
  } = props;

  return (
    <ButtonBase
      {...restProps}
      className={[
        styles.IconButton,
        className,
      ]}
      data-icon-position={iconPosition}
    >
      {iconPosition === 'leading' && (
        <Box
          aria-hidden={true}
          as="span"
          className={styles.Icon}
        >
          {icon}
        </Box>
      )}
      <Box
        as="span"
        className={styles.Text}
      >
        {children}
      </Box>
      {iconPosition === 'trailing' && (
        <Box
          aria-hidden={true}
          as="span"
          className={styles.Icon}
        >
          {icon}
        </Box>
      )}
    </ButtonBase>
  );
}
