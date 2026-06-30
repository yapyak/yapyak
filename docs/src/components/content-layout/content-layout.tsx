import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content-layout.module.css';
import { ContentLayoutContent } from './content-layout-content';
import { ContentLayoutContentContent } from './content-layout-content-content';
import { ContentLayoutContentHeader } from './content-layout-content-header';
import { ContentLayoutOutline } from './content-layout-outline';
import { ContentLayoutSidebar } from './content-layout-sidebar';

export type ContentLayoutProps = BoxProps;

export function ContentLayout(props: ContentLayoutProps) {
  const { children, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.ContentLayout,
        className,
      ]}
    >
      {children}
    </Box>
  );
}

ContentLayout.Sidebar = ContentLayoutSidebar;
ContentLayout.Content = ContentLayoutContent;
ContentLayout.ContentHeader = ContentLayoutContentHeader;
ContentLayout.ContentContent = ContentLayoutContentContent;
ContentLayout.Outline = ContentLayoutOutline;
