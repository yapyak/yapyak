import type { ReactNode } from 'react';
import type { ButtonBaseProps } from '#primitives/button';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './page-action.module.css';

export type PageActionButtonProps = ButtonBaseProps & {
  icon: ReactNode;
  label: string;
  trailingIcon?: ReactNode;
};

export function PageActionButton(props: PageActionButtonProps) {
  const { className, icon, label, trailingIcon, ...restProps } = props;

  return (
    <ButtonBase
      {...restProps}
      className={[
        styles.Button,
        className,
      ]}
    >
      <Box
        as="span"
        className={styles.LeadingIcon}
      >
        {icon}
      </Box>
      <Box
        as="span"
        className={styles.Label}
      >
        {label}
      </Box>
      {trailingIcon && (
        <Box
          aria-hidden={true}
          as="span"
          className={styles.TrailingIcon}
        >
          {trailingIcon}
        </Box>
      )}
    </ButtonBase>
  );
}
