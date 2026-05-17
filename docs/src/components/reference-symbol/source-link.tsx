import type { HTMLAttributes, ReactElement } from 'react';

import styles from './source-link.module.css';

export interface ReferenceSymbolSourceLinkProps
  extends HTMLAttributes<HTMLElement> {
  file: string;
  line: number;
}

export function ReferenceSymbolSourceLink(
  props: ReferenceSymbolSourceLinkProps,
): ReactElement {
  const { file, line, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolSourceLink} ${className}`
    : styles.ReferenceSymbolSourceLink;
  return (
    <footer
      {...restProps}
      className={merged}
    >
      <span className={styles.Path}>
        {file}:{line}
      </span>
    </footer>
  );
}
