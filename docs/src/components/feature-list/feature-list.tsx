import type { ReactElement } from 'react';

import styles from './feature-list.module.css';
import { FeatureListItem } from './feature-list-item';
import { FEATURES } from './features';

export function FeatureList(): ReactElement {
  return (
    <section className={styles.FeatureList}>
      <div
        aria-hidden="true"
        className={styles.Divider}
      />
      <ol className={styles.List}>
        {FEATURES.map((feature) => (
          <FeatureListItem
            feature={feature}
            key={feature.number}
          />
        ))}
      </ol>
    </section>
  );
}
