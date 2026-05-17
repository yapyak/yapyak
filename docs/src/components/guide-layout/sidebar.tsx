import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './sidebar.module.css';

export interface GuideLayoutSidebarProps extends BoxProps<'aside'> {}

export function GuideLayoutSidebar(props: GuideLayoutSidebarProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="aside"
      className={[styles.GuideLayoutSidebar, className]}
    />
  );
}
