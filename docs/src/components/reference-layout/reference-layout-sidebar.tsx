import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './reference-layout-sidebar.module.css';

export interface ReferenceLayoutSidebarProps
  extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function ReferenceLayoutSidebar(
  props: ReferenceLayoutSidebarProps,
): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceLayoutSidebar} ${className}`
    : styles.ReferenceLayoutSidebar;
  return (
    <aside
      {...restProps}
      className={merged}
    >
      {children}
    </aside>
  );
}
