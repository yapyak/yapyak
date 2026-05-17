import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './sidebar.module.css';

export interface ReferenceLayoutSidebarProps extends BoxProps<'aside'> {}

export function ReferenceLayoutSidebar(props: ReferenceLayoutSidebarProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="aside"
      className={[styles.ReferenceLayoutSidebar, className]}
    />
  );
}
