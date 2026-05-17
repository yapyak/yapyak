import type { ReactElement } from 'react';
import type { Feature } from '#utils/features';

import styles from './feature-list-item.module.css';

export interface FeatureListItemProps {
  feature: Feature;
}

export function FeatureListItem(props: FeatureListItemProps): ReactElement {
  const { feature } = props;
  return (
    <li
      className={styles.FeatureListItem}
      data-accent={feature.accent}
    >
      <span
        aria-hidden="true"
        className={styles.Indicator}
      />
      <span className={styles.Numeral}>{feature.number}</span>
      <div className={styles.Content}>
        <h3 className={styles.Title}>{feature.title}</h3>
        <span
          aria-hidden="true"
          className={styles.Underline}
        />
        <p className={styles.Description}>{feature.description}</p>
      </div>
    </li>
  );
}
