import { type ReactElement, useEffect, useRef, useState } from 'react';
import { type Framework, HeroDemoEditor } from './hero-demo-editor';
import { HeroDemoLocales } from './hero-demo-locales';
import styles from './hero-demo.module.css';
import { useDemoState } from './use-demo-state';

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
      ref={containerElement}
      className={styles.HeroDemo}
      data-active={isActive || undefined}
    >
      <div className={styles.Stack}>
        <HeroDemoEditor
          source={state.source}
          typing={state.typing}
          framework={framework}
          onFrameworkChange={setFramework}
        />
        <HeroDemoLocales
          savedSource={state.savedSource}
          translations={state.translations}
          shimmering={state.shimmering}
        />
      </div>
    </div>
  );
}
