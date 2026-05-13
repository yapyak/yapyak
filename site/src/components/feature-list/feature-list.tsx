import {
  type CSSProperties,
  type ReactElement,
  useRef,
  useState,
} from 'react';
import { FeatureListItem } from './feature-list-item';
import styles from './feature-list.module.css';
import { FEATURES } from './features';

interface IndicatorState {
  top: number;
  height: number;
  visible: boolean;
}

const INITIAL_INDICATOR: IndicatorState = {
  top: 0,
  height: 0,
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
      setIndicator({ top, height, visible: true });
      return;
    }
    visibleRef.current = true;
    setIndicator({ top, height, visible: false });
    window.requestAnimationFrame(() => {
      setIndicator((previous) => ({ ...previous, visible: true }));
    });
  };

  const handleListLeave = () => {
    visibleRef.current = false;
    setIndicator((previous) => ({ ...previous, visible: false }));
  };

  const indicatorStyle: CSSProperties = {
    transform: `translateY(${indicator.top}px)`,
    height: `${indicator.height}px`,
  };

  return (
    <section className={styles.FeatureList}>
      <div className={styles.Divider} aria-hidden="true" />
      <ol className={styles.List} onMouseLeave={handleListLeave}>
        <span
          aria-hidden="true"
          className={styles.Indicator}
          data-visible={indicator.visible || undefined}
          style={indicatorStyle}
        />
        {FEATURES.map((feature, index) => (
          <FeatureListItem
            key={feature.number}
            feature={feature}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            onMouseEnter={() => handleItemEnter(index)}
          />
        ))}
      </ol>
    </section>
  );
}
