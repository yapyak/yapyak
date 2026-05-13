import { forwardRef, type MouseEventHandler, type ReactElement } from 'react';
import type { Feature } from './features';
import styles from './feature-list-item.module.css';

export interface FeatureListItemProps {
  feature: Feature;
  onMouseEnter?: MouseEventHandler<HTMLLIElement>;
}

export const FeatureListItem = forwardRef<HTMLLIElement, FeatureListItemProps>(
  function FeatureListItem(props, ref): ReactElement {
    const { feature, onMouseEnter } = props;
    return (
      <li
        ref={ref}
        className={styles.FeatureListItem}
        data-accent={feature.accent}
        onMouseEnter={onMouseEnter}
      >
        <span className={styles.Numeral}>{feature.number}</span>
        <div className={styles.Content}>
          <h3 className={styles.Title}>{feature.title}</h3>
          <span className={styles.Underline} aria-hidden="true" />
          <p className={styles.Description}>{feature.description}</p>
        </div>
      </li>
    );
  },
);
