import type { ReactNode } from 'react';
import type { ButtonBaseProps } from '#primitives/button';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './page-action.module.css';

export type PageActionTileProps = ButtonBaseProps & {
  icon: ReactNode;
  label: string;
  trailingIcon?: ReactNode;
};

export function PageActionTile(props: PageActionTileProps) {
  const { className, icon, label, trailingIcon, ...restProps } = props;

  return (
    <ButtonBase
      {...restProps}
      className={[
        styles.Tile,
        className,
      ]}
    >
      <Box
        as="span"
        className={styles.TileIcon}
      >
        {icon}
      </Box>
      <Box
        as="span"
        className={styles.TileLabel}
      >
        {label}
      </Box>
      {trailingIcon && (
        <Box
          aria-hidden={true}
          as="span"
          className={styles.TileTrailingIcon}
        >
          {trailingIcon}
        </Box>
      )}
    </ButtonBase>
  );
}
