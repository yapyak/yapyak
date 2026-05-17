import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { ReferenceLayoutContent } from './reference-layout/content';
import { ReferenceLayoutSidebar } from './reference-layout/sidebar';
import styles from './reference-layout.module.css';

export interface ReferenceLayoutProps extends BoxProps {}

export function ReferenceLayout(props: ReferenceLayoutProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.ReferenceLayout, className]}
    />
  );
}

ReferenceLayout.Sidebar = ReferenceLayoutSidebar;
ReferenceLayout.Content = ReferenceLayoutContent;
