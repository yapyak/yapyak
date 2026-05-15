import type { HTMLAttributes, ReactElement } from 'react';

import styles from './reference-symbol-signature.module.css';

export interface ReferenceSymbolSignatureProps
  extends HTMLAttributes<HTMLElement> {
  html: string;
}

export function ReferenceSymbolSignature(
  props: ReferenceSymbolSignatureProps,
): ReactElement {
  const { html, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolSignature} ${className}`
    : styles.ReferenceSymbolSignature;
  return (
    <section
      {...restProps}
      className={merged}
    >
      <h2 className={styles.Heading}>Signature</h2>
      <div
        className={styles.Body}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
