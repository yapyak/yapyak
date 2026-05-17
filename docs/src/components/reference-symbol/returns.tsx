import type { HTMLAttributes, ReactElement } from 'react';

import styles from './returns.module.css';

export interface ReferenceSymbolReturnsProps
  extends HTMLAttributes<HTMLElement> {
  description?: string;
  type: string;
}

export function ReferenceSymbolReturns(
  props: ReferenceSymbolReturnsProps,
): ReactElement {
  const { type, description, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolReturns} ${className}`
    : styles.ReferenceSymbolReturns;
  return (
    <section
      {...restProps}
      className={merged}
    >
      <h2 className={styles.Heading}>Returns</h2>
      <p className={styles.Line}>
        <code>{type}</code>
        {description !== undefined && description !== ''
          ? ` — ${description}`
          : null}
      </p>
    </section>
  );
}
