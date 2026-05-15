import type { HTMLAttributes, ReactElement } from 'react';
import styles from './reference-symbol-description.module.css';

export interface ReferenceSymbolDescriptionProps
  extends HTMLAttributes<HTMLElement> {
  html: string;
}

export function ReferenceSymbolDescription(
  props: ReferenceSymbolDescriptionProps,
): ReactElement {
  const { html, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolDescription} ${className}`
    : styles.ReferenceSymbolDescription;
  return (
    <section {...restProps} className={merged}>
      <div
        className={styles.Body}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
