import type { BoxProps } from '#components/box';
import type { Framework } from './demo/editor';

import { useEffect, useRef, useState } from 'react';

import { Box } from '#components/box';
import { useDemoState } from '#hooks/use-demo-state';

import { HeroDemoEditor } from './demo/editor';
import { HeroDemoLocales } from './demo/locales';
import styles from './demo.module.css';

export interface HeroDemoProps extends BoxProps {}

export function HeroDemo(props: HeroDemoProps) {
  const { className, ...restProps } = props;
  const containerElement = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [framework, setFramework] = useState<Framework>('react');

  useEffect(() => {
    const $element = containerElement.current;
    if (!$element) {
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
    <Box
      {...restProps}
      className={[styles.HeroDemo, className]}
      data-active={isActive}
      ref={containerElement}
    >
      <Box className={styles.Stack}>
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
      </Box>
    </Box>
  );
}
