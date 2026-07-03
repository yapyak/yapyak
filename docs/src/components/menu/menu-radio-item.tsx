import type { ReactNode } from 'react';
import type { MenuBaseRadioItemProps } from '#primitives/menu';

import { Icon } from '#components/icon';
import { Box } from '#primitives/box';
import { MenuBaseRadioItem } from '#primitives/menu';

import styles from './menu-radio-item.module.css';

export type MenuRadioItemProps = MenuBaseRadioItemProps & {
  leadingIcon?: ReactNode;
};

export function MenuRadioItem(props: MenuRadioItemProps) {
  const { children, className, leadingIcon, ...restProps } = props;

  return (
    <MenuBaseRadioItem
      {...restProps}
      className={[
        styles.MenuRadioItem,
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
      <Box
        aria-hidden={true}
        as="span"
        className={styles.Check}
      >
        <Icon
          name="check"
          size="14"
        />
      </Box>
    </MenuBaseRadioItem>
  );
}
