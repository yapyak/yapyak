import type { ReactElement } from 'react';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content-layout-content-header.module.css';

export type ContentLayoutContentHeaderProps = BoxProps<'header'>;

export function ContentLayoutContentHeader(
  props: ContentLayoutContentHeaderProps,
): ReactElement {
  const { children, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="header"
      className={[
        styles.ContentLayoutContentHeader,
        className,
      ]}
    >
      {children}
    </Box>
  );
}
