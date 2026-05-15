import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import { cn } from '#lib/cn';

import styles from './layout-header-center.module.css';

export interface LayoutHeaderCenterProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function LayoutHeaderCenter(
  props: LayoutHeaderCenterProps,
): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <div
      {...restProps}
      className={cn(styles.LayoutHeaderCenter, className)}
    >
      {children}
    </div>
  );
}
