import type { ReactNode } from 'react';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './page-action.module.css';

export type PageActionLinkTileProps = BoxProps<'a'> & {
  href: string;
  icon: ReactNode;
  label: string;
};

export function PageActionLinkTile(props: PageActionLinkTileProps) {
  const { className, href, icon, label, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="a"
      className={[
        styles.Tile,
        className,
      ]}
      href={href}
      rel="noreferrer"
      target="_blank"
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
    </Box>
  );
}
