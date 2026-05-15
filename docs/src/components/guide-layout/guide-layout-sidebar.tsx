import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './guide-layout-sidebar.module.css';

export interface GuideLayoutSidebarProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function GuideLayoutSidebar(
  props: GuideLayoutSidebarProps,
): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className
    ? `${styles.GuideLayoutSidebar} ${className}`
    : styles.GuideLayoutSidebar;
  return (
    <aside
      {...restProps}
      className={merged}
    >
      {children}
    </aside>
  );
}
