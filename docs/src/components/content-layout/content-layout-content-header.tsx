import type { ReactElement, ReactNode } from 'react';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './content-layout-content-header.module.css';

export type ContentLayoutContentHeaderProps = BoxProps<'header'> & {
  end?: ReactNode;
  start?: ReactNode;
};

export function ContentLayoutContentHeader(
  props: ContentLayoutContentHeaderProps,
): ReactElement {
  const { className, end, start, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="header"
      className={[
        styles.ContentLayoutContentHeader,
        className,
      ]}
    >
      <Box className={styles.Start}>{start}</Box>
      <Box className={styles.End}>{end}</Box>
    </Box>
  );
}
