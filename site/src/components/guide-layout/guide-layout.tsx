import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './guide-layout.module.css';
import { GuideLayoutContent } from './guide-layout-content';
import { GuideLayoutSidebar } from './guide-layout-sidebar';

export interface GuideLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export declare namespace GuideLayout {
  let Sidebar: typeof GuideLayoutSidebar;
  let Content: typeof GuideLayoutContent;
}

export function GuideLayout(props: GuideLayoutProps): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className
    ? `${styles.GuideLayout} ${className}`
    : styles.GuideLayout;
  return (
    <div
      {...restProps}
      className={merged}
    >
      {children}
    </div>
  );
}

GuideLayout.Sidebar = GuideLayoutSidebar;
GuideLayout.Content = GuideLayoutContent;
