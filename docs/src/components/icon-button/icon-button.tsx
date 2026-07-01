import type { ReactElement, ReactNode } from 'react';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './icon-button.module.css';

export type IconButtonIconPosition = 'leading' | 'trailing';

export type IconButtonProps = BoxProps<'button'> & {
  icon: ReactNode;
  iconPosition?: IconButtonIconPosition;
};

export function IconButton(props: IconButtonProps): ReactElement {
  const {
    children,
    className,
    icon,
    iconPosition = 'leading',
    ...restProps
  } = props;

  return (
    <Box
      {...restProps}
      as="button"
      className={[
        styles.IconButton,
        className,
      ]}
      data-icon-position={iconPosition}
      type="button"
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
    </Box>
  );
}
