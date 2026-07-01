import type { ReactElement } from 'react';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './content-layout-outline.module.css';

export type ContentLayoutOutlineProps = BoxProps<'aside'>;

export function ContentLayoutOutline(
  props: ContentLayoutOutlineProps,
): ReactElement {
  const { children, className, ...restProps } = props;

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
