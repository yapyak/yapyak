import type { DrawerProps } from '#components/drawer';

import { Drawer } from '#components/drawer';

import { useContentLayout } from './content-layout';
import styles from './content-layout-outline.module.css';

export type ContentLayoutOutlineProps = Omit<DrawerProps, 'direction' | 'open'>;

export function ContentLayoutOutline(props: ContentLayoutOutlineProps) {
  const { className, ...restProps } = props;

  const { outlineOpen, resizing } = useContentLayout();

  return (
    <Drawer
      {...restProps}
      className={[
        styles.ContentLayoutOutline,
        className,
      ]}
      data-no-transition={resizing ? '' : undefined}
      direction="end"
      open={outlineOpen}
    />
  );
}
