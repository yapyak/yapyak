import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '#lib/cn';
import { LayoutHeader } from './layout-header';
import { LayoutMain } from './layout-main';
import styles from './layout.module.css';

export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export declare namespace Layout {
  let Header: typeof LayoutHeader;
  let Main: typeof LayoutMain;
}

export function Layout(props: LayoutProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <div {...restProps} className={cn(styles.Layout, className)}>
      {children}
    </div>
  );
}

Layout.Header = LayoutHeader;
Layout.Main = LayoutMain;
