import type { SwatchAccent } from '#components/swatch';
import type { MenuBaseRadioItemProps } from '#primitives/menu';

import { CheckIcon } from '#components/check-icon';
import { Swatch } from '#components/swatch';
import { Box } from '#primitives/box';
import { MenuBaseRadioItem } from '#primitives/menu';

import styles from './menu-radio-item.module.css';

export type MenuRadioItemProps = MenuBaseRadioItemProps & {
  accent?: SwatchAccent;
};

export function MenuRadioItem(props: MenuRadioItemProps) {
  const { accent, children, className, ...restProps } = props;

  return (
    <MenuBaseRadioItem
      {...restProps}
      className={[
        styles.MenuRadioItem,
        className,
      ]}
    >
      {accent !== undefined && (
        <Swatch
          accent={accent}
          className={styles.Swatch}
        />
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
        <CheckIcon />
      </Box>
    </MenuBaseRadioItem>
  );
}
