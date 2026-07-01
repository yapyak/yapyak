import type { ReactNode } from 'react';
import type { ButtonBaseProps } from '#primitives/button';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './page-action.module.css';

export type PageActionTileProps = ButtonBaseProps & {
  icon: ReactNode;
  label: string;
};

export function PageActionTile(props: PageActionTileProps) {
  const { className, icon, label, ...restProps } = props;

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
    </ButtonBase>
  );
}
