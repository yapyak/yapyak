import type { ReactElement } from 'react';
import type { Feature } from './features';
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
      <span className={styles.HoverBar} aria-hidden="true" />
      <span className={styles.Numeral}>{feature.number}</span>
      <div className={styles.Content}>
        <h3 className={styles.Title}>{feature.title}</h3>
        <span className={styles.Underline} aria-hidden="true" />
        <p className={styles.Description}>{feature.description}</p>
      </div>
    </li>
  );
}
