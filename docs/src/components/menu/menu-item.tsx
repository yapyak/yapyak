import type { ReactNode } from 'react';
import type { MenuBaseItemProps } from '#primitives/menu';

import { Box } from '#primitives/box';
import { MenuBaseItem } from '#primitives/menu';

import styles from './menu-item.module.css';

export type MenuItemProps = MenuBaseItemProps & {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function MenuItem(props: MenuItemProps) {
  const { children, className, leadingIcon, trailingIcon, ...restProps } =
    props;

  return (
    <MenuBaseItem
      {...restProps}
      className={[
        styles.MenuItem,
        className,
      ]}
    >
      {leadingIcon && (
        <Box
          aria-hidden={true}
          as="span"
          className={styles.LeadingIcon}
        >
          {leadingIcon}
        </Box>
      )}
      <Box
        as="span"
        className={styles.Label}
      >
        {children}
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
    </MenuBaseItem>
  );
}
