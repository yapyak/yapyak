import type { CSSProperties, ReactElement } from 'react';

import { useRef, useState } from 'react';

import styles from './feature-list.module.css';
import { FeatureListItem } from './feature-list-item';
import { FEATURES } from './features';

interface IndicatorState {
  height: number;
  top: number;
  visible: boolean;
}

const INITIAL_INDICATOR: IndicatorState = {
  height: 0,
  top: 0,
  visible: false,
};

export function FeatureList(): ReactElement {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const visibleRef = useRef(false);
  const [indicator, setIndicator] = useState<IndicatorState>(INITIAL_INDICATOR);

  const handleItemEnter = (index: number) => {
    const item = itemRefs.current[index];
    if (item === null || item === undefined) {
      return;
    }
    const top = item.offsetTop;
    const height = item.offsetHeight;
    if (visibleRef.current) {
      setIndicator({ height, top, visible: true });
      return;
    }
    visibleRef.current = true;
    setIndicator({ height, top, visible: false });
    window.requestAnimationFrame(() => {
      setIndicator((previous) => ({ ...previous, visible: true }));
    });
  };

  const handleListLeave = () => {
    visibleRef.current = false;
    setIndicator((previous) => ({ ...previous, visible: false }));
  };

  const indicatorStyle: CSSProperties = {
    height: `${indicator.height}px`,
    transform: `translateY(${indicator.top}px)`,
  };

  return (
    <section className={styles.FeatureList}>
      <div
        aria-hidden="true"
        className={styles.Divider}
      />
      <ol
        className={styles.List}
        onMouseLeave={handleListLeave}
      >
        <span
          aria-hidden="true"
          className={styles.Indicator}
          data-visible={indicator.visible || undefined}
          style={indicatorStyle}
        />
        {FEATURES.map((feature, index) => (
          <FeatureListItem
            feature={feature}
            key={feature.number}
            onMouseEnter={() => handleItemEnter(index)}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
          />
        ))}
      </ol>
    </section>
  );
}
