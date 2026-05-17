import type { HTMLAttributes, ReactElement } from 'react';

import styles from './header.module.css';

export interface ReferenceSymbolHeaderProps
  extends HTMLAttributes<HTMLElement> {
  kind: string;
  module: string;
  name: string;
}

export function ReferenceSymbolHeader(
  props: ReferenceSymbolHeaderProps,
): ReactElement {
  const { module, kind, name, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolHeader} ${className}`
    : styles.ReferenceSymbolHeader;
  return (
    <header
      {...restProps}
      className={merged}
    >
      <span className={styles.Eyebrow}>
        {module} <span className={styles.EyebrowDot}>·</span> {kind}
      </span>
      <h1 className={styles.Heading}>{name}</h1>
    </header>
  );
}
