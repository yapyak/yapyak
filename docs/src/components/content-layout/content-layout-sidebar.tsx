import type { ReactElement } from 'react';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content-layout-sidebar.module.css';

export type ContentLayoutSidebarProps = BoxProps<'aside'>;

export function ContentLayoutSidebar(
  props: ContentLayoutSidebarProps,
): ReactElement {
  const { children, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="aside"
      className={[
        styles.ContentLayoutSidebar,
        className,
      ]}
      id="sidebar"
    >
      {children}
    </Box>
  );
}
