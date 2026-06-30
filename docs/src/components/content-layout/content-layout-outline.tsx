import type { ReactElement } from 'react';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { Drawer } from '#components/drawer';
import { useMediaQuery } from '#hooks/use-media-query';

import { useContentLayout } from './content-layout';
import styles from './content-layout-outline.module.css';

export type ContentLayoutOutlineProps = BoxProps<'aside'>;

export function ContentLayoutOutline(
  props: ContentLayoutOutlineProps,
): ReactElement {
  const { children, className, ...restProps } = props;
  const { closeOutline, outlineOpen } = useContentLayout();
  const isWide = useMediaQuery('(min-width: 1324px)');

  if (isWide) {
    return (
      <Box
        {...restProps}
        as="aside"
        className={[
          styles.ContentLayoutOutline,
          className,
        ]}
      >
        {children}
      </Box>
    );
  }

  return (
    <Drawer
      {...restProps}
      className={[
        styles.ContentLayoutOutline,
        className,
      ]}
      direction="end"
      onClose={closeOutline}
      open={outlineOpen}
    >
      {children}
    </Drawer>
  );
}
