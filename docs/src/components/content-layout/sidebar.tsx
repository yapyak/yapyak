import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './sidebar.module.css';

export interface ContentLayoutSidebarProps extends BoxProps<'aside'> {}

export function ContentLayoutSidebar(props: ContentLayoutSidebarProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="aside"
      className={[styles.ContentLayoutSidebar, className]}
    />
  );
}
