import {
  type CSSProperties,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FeatureListItem } from './feature-list-item';
import styles from './feature-list.module.css';
import { FEATURES } from './features';

interface IndicatorState {
  top: number;
  height: number;
}

export function FeatureList(): ReactElement {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const triggerLine = window.innerHeight * 0.4;
      let nextIndex = 0;
      for (let index = 0; index < itemRefs.current.length; index++) {
        const item = itemRefs.current[index];
        if (item === null || item === undefined) {
          continue;
        }
        const rect = item.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          nextIndex = index;
        } else {
          break;
        }
      }
      const activeItem = itemRefs.current[nextIndex];
      if (activeItem !== null && activeItem !== undefined) {
        setActiveIndex(nextIndex);
        setIndicator({
          top: activeItem.offsetTop,
          height: activeItem.offsetHeight,
        });
      }
    };

    const onScroll = () => {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const indicatorStyle: CSSProperties | undefined =
    indicator !== null
      ? {
          transform: `translateY(${indicator.top}px)`,
          height: `${indicator.height}px`,
        }
      : undefined;

  return (
    <section className={styles.FeatureList}>
      <div className={styles.Divider} aria-hidden="true" />
      <ol className={styles.List}>
        {indicator !== null ? (
          <span
            aria-hidden="true"
            className={styles.Indicator}
            style={indicatorStyle}
          />
        ) : null}
        {FEATURES.map((feature, index) => (
          <FeatureListItem
            key={feature.number}
            feature={feature}
            isActive={index === activeIndex}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
          />
        ))}
      </ol>
    </section>
  );
}
