import type { PointerEventHandler, ReactElement, Ref } from 'react';
import type { Feature } from './features';

import styles from './feature-list-item.module.css';

export interface FeatureListItemProps {
  feature: Feature;
  onPointerEnter?: PointerEventHandler<HTMLLIElement>;
  ref?: Ref<HTMLLIElement>;
}

export function FeatureListItem(props: FeatureListItemProps): ReactElement {
  const { feature, onPointerEnter, ref } = props;
  return (
    <li
      className={styles.FeatureListItem}
      data-accent={feature.accent}
      onPointerEnter={onPointerEnter}
      ref={ref}
    >
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
