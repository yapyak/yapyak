import type { HTMLAttributes, ReactElement } from 'react';
import styles from './reference-symbol-deprecated.module.css';

export interface ReferenceSymbolDeprecatedProps
  extends HTMLAttributes<HTMLDivElement> {
  message: string;
}

export function ReferenceSymbolDeprecated(
  props: ReferenceSymbolDeprecatedProps,
): ReactElement {
  const { message, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolDeprecated} ${className}`
    : styles.ReferenceSymbolDeprecated;
  return (
    <div {...restProps} className={merged}>
      <strong>Deprecated.</strong> {message}
    </div>
  );
}
