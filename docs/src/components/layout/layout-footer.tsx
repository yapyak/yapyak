import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import { cn } from '#lib/cn';

import styles from './layout-footer.module.css';

export interface LayoutFooterProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function LayoutFooter(props: LayoutFooterProps): ReactElement {
  const { children, className, ...restProps } = props;
  return (
    <footer
      {...restProps}
      className={cn(styles.LayoutFooter, className)}
    >
      {children}
    </footer>
  );
}
