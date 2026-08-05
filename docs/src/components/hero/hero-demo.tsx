import type { Framework } from '#lib/hero-demo';
import type { BoxProps } from '#primitives/box';

import { useState } from 'react';

import { useDemoState } from '#hooks/use-demo-state';
import { Box } from '#primitives/box';

import styles from './hero-demo.module.css';
import { HeroDemoEditor } from './hero-demo-editor';
import { HeroDemoLocaleStack } from './hero-demo-locale-stack';

export type HeroDemoProps = BoxProps;

export function HeroDemo(props: HeroDemoProps) {
  const { className, ...restProps } = props;
  const [framework, setFramework] = useState<Framework>('react');
  const state = useDemoState();

  return (
    <Box
      {...restProps}
      className={[
        styles.HeroDemo,
        className,
      ]}
    >
      <HeroDemoEditor
        framework={framework}
        onFrameworkChange={setFramework}
        saving={state.saving}
        source={state.source}
        typing={state.typing}
      />
      <HeroDemoLocaleStack
        receiving={state.receiving}
        savedSource={state.savedSource}
        shimmering={state.shimmering}
        translations={state.translations}
      />
    </Box>
  );
}
