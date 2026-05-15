import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { ReferenceLayoutContent } from './reference-layout-content';
import { ReferenceLayoutSidebar } from './reference-layout-sidebar';
import styles from './reference-layout.module.css';

export interface ReferenceLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export declare namespace ReferenceLayout {
  let Sidebar: typeof ReferenceLayoutSidebar;
  let Content: typeof ReferenceLayoutContent;
}

export function ReferenceLayout(props: ReferenceLayoutProps): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceLayout} ${className}`
    : styles.ReferenceLayout;
  return (
    <div {...restProps} className={merged}>
      {children}
    </div>
  );
}

ReferenceLayout.Sidebar = ReferenceLayoutSidebar;
ReferenceLayout.Content = ReferenceLayoutContent;
