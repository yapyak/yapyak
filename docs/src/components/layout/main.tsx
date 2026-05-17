import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import { cn } from '#lib/cn';

import styles from './main.module.css';

export interface LayoutMainProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function LayoutMain(props: LayoutMainProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <main
      {...restProps}
      className={cn(styles.LayoutMain, className)}
    >
      {children}
    </main>
  );
}
