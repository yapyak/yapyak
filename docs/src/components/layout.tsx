import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import { cn } from '#lib/cn';

import { LayoutFooter } from './layout/footer';
import { LayoutHeader } from './layout/header';
import { LayoutMain } from './layout/main';
import styles from './layout.module.css';

export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Layout(props: LayoutProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <div
      {...restProps}
      className={cn(styles.Layout, className)}
    >
      <div
        aria-hidden="true"
        className={styles.Grain}
      />
      {children}
    </div>
  );
}

Layout.Header = LayoutHeader;
Layout.Main = LayoutMain;
Layout.Footer = LayoutFooter;
