import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import { cn } from '#lib/cn';

import styles from './end.module.css';

export interface LayoutHeaderEndProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function LayoutHeaderEnd(props: LayoutHeaderEndProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <div
      {...restProps}
      className={cn(styles.LayoutHeaderEnd, className)}
    >
      {children}
    </div>
  );
}
