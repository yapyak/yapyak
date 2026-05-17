import type { ReactElement } from 'react';

import { FEATURES } from '#utils/features';

import { FeatureListItem } from './feature-list/item';
import styles from './feature-list.module.css';

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
