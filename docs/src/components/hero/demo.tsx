import type { BoxProps } from '#components/box';
import type { Framework } from './demo/editor';

import { useEffect, useRef, useState } from 'react';

import { Box } from '#components/box';
import { useDemoState } from '#hooks/use-demo-state';

import { DemoEditor } from './demo/editor';
import { DemoLocaleStack } from './demo/locale-stack';
import styles from './demo.module.css';

export interface HeroDemoProps extends BoxProps {}

export function HeroDemo(props: HeroDemoProps) {
  const { className, ...restProps } = props;
  const element = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [framework, setFramework] = useState<Framework>('react');

  useEffect(() => {
    const $element = element.current;
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
      ref={element}
    >
      <Box className={styles.Stack}>
        <DemoEditor
          framework={framework}
          isSaving={state.isSaving}
          isTyping={state.isTyping}
          onFrameworkChange={setFramework}
          source={state.source}
        />
        <DemoLocaleStack
          isReceiving={state.isReceiving}
          savedSource={state.savedSource}
          shimmering={state.shimmering}
          translations={state.translations}
        />
      </Box>
    </Box>
  );
}
