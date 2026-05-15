import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './guide-layout-content.module.css';

export interface GuideLayoutContentProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function GuideLayoutContent(
  props: GuideLayoutContentProps,
): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className
    ? `${styles.GuideLayoutContent} ${className}`
    : styles.GuideLayoutContent;
  return (
    <main
      {...restProps}
      className={merged}
    >
      {children}
    </main>
  );
}
