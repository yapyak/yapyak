import type { HTMLAttributes, ReactElement } from 'react';

import styles from './reference-symbol-examples.module.css';

export interface ReferenceSymbolExamplesProps
  extends HTMLAttributes<HTMLElement> {
  htmls: string[];
}

export function ReferenceSymbolExamples(
  props: ReferenceSymbolExamplesProps,
): ReactElement {
  const { htmls, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolExamples} ${className}`
    : styles.ReferenceSymbolExamples;
  return (
    <section
      {...restProps}
      className={merged}
    >
      <h2 className={styles.Heading}>Examples</h2>
      {htmls.map((html, index) => (
        <div
          className={styles.Body}
          dangerouslySetInnerHTML={{ __html: html }}
          key={index}
        />
      ))}
    </section>
  );
}
