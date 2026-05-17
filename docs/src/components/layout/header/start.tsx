import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import { cn } from '#lib/cn';

import styles from './start.module.css';

export interface LayoutHeaderStartProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function LayoutHeaderStart(props: LayoutHeaderStartProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <div
      {...restProps}
      className={cn(styles.LayoutHeaderStart, className)}
    >
      {children}
    </div>
  );
}
