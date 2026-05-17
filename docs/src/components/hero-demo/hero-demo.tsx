import type { ReactElement } from 'react';
import type { Framework } from './hero-demo-editor';

import { useEffect, useRef, useState } from 'react';

import styles from './hero-demo.module.css';
import { HeroDemoEditor } from './hero-demo-editor';
import { HeroDemoLocales } from './hero-demo-locales';
import { useDemoState } from '#hooks/use-demo-state';

export function HeroDemo(): ReactElement {
  const containerElement = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [framework, setFramework] = useState<Framework>('react');

  useEffect(() => {
    const $element = containerElement.current;
    if ($element === null) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsActive(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe($element);
    return () => observer.disconnect();
  }, []);

  const state = useDemoState(isActive);

  return (
    <div
      className={styles.HeroDemo}
      data-active={isActive || undefined}
      ref={containerElement}
    >
      <div className={styles.Stack}>
        <HeroDemoEditor
          framework={framework}
          onFrameworkChange={setFramework}
          saving={state.saving}
          source={state.source}
          typing={state.typing}
        />
        <HeroDemoLocales
          receiving={state.receiving}
          savedSource={state.savedSource}
          shimmering={state.shimmering}
          translations={state.translations}
        />
      </div>
    </div>
  );
}
