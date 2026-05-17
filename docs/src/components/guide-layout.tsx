import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { GuideLayoutContent } from './guide-layout/content';
import { GuideLayoutSidebar } from './guide-layout/sidebar';
import styles from './guide-layout.module.css';

export interface GuideLayoutProps extends BoxProps {}

export function GuideLayout(props: GuideLayoutProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.GuideLayout, className]}
    />
  );
}

GuideLayout.Sidebar = GuideLayoutSidebar;
GuideLayout.Content = GuideLayoutContent;
