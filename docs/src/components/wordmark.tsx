import type { ReactElement } from 'react';

import styles from './wordmark.module.css';

export function Wordmark(): ReactElement {
  return (
    <span className={styles.Wordmark}>
      <span className={styles.Yap}>yap</span>
      <span className={styles.Yak}>yak</span>
    </span>
  );
}
