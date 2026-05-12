import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '#lib/cn';
import { LayoutHeaderCenter } from './layout-header-center';
import { LayoutHeaderEnd } from './layout-header-end';
import { LayoutHeaderStart } from './layout-header-start';
import styles from './layout-header.module.css';

export interface LayoutHeaderProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export declare namespace LayoutHeader {
  let Start: typeof LayoutHeaderStart;
  let Center: typeof LayoutHeaderCenter;
  let End: typeof LayoutHeaderEnd;
}

export function LayoutHeader(props: LayoutHeaderProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <header {...restProps} className={cn(styles.LayoutHeader, className)}>
      {children}
    </header>
  );
}

LayoutHeader.Start = LayoutHeaderStart;
LayoutHeader.Center = LayoutHeaderCenter;
LayoutHeader.End = LayoutHeaderEnd;
