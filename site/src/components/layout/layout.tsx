import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '#lib/cn';
import styles from './layout.module.css';

export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface LayoutSlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

function LayoutHeader(props: LayoutSlotProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <header {...restProps} className={cn(styles.Header, className)}>
      {children}
    </header>
  );
}

function LayoutMain(props: LayoutSlotProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <main {...restProps} className={cn(styles.Main, className)}>
      {children}
    </main>
  );
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
