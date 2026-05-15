import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './reference-layout-content.module.css';

export interface ReferenceLayoutContentProps
  extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function ReferenceLayoutContent(
  props: ReferenceLayoutContentProps,
): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceLayoutContent} ${className}`
    : styles.ReferenceLayoutContent;
  return (
    <main
      {...restProps}
      className={merged}
    >
      {children}
    </main>
  );
}
