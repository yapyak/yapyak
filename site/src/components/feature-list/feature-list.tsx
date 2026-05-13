import type { ReactElement } from 'react';
import { FeatureListItem } from './feature-list-item';
import styles from './feature-list.module.css';
import { FEATURES } from './features';

export function FeatureList(): ReactElement {
  return (
    <section className={styles.FeatureList}>
      <div className={styles.Divider} aria-hidden="true" />
      <ol className={styles.List}>
        {FEATURES.map((feature) => (
          <FeatureListItem key={feature.number} feature={feature} />
        ))}
      </ol>
    </section>
  );
}
