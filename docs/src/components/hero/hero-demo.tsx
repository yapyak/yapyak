import type { Framework } from '#lib/hero-demo';
import type { BoxProps } from '#primitives/box';

import { useLayoutEffect, useState } from 'react';

import { useDemoState } from '#hooks/use-demo-state';
import { FRAMEWORK_DEFINITIONS } from '#lib/hero-demo';
import { Box } from '#primitives/box';

import styles from './hero-demo.module.css';
import { HeroDemoEditor } from './hero-demo-editor';
import { HeroDemoLocaleStack } from './hero-demo-locale-stack';

export type HeroDemoProps = BoxProps & {
  initialFramework?: string;
};

export function HeroDemo(props: HeroDemoProps) {
  const { className, initialFramework, ...restProps } = props;
  const [framework, setFramework] = useState<Framework>(
    FRAMEWORK_DEFINITIONS[0].framework,
  );
  const state = useDemoState();

  useLayoutEffect(() => {
    const definition = FRAMEWORK_DEFINITIONS.find(
      (candidate) => candidate.framework === initialFramework,
    );
    if (definition !== undefined) {
      setFramework(definition.framework);
    }
  }, [
    initialFramework,
  ]);

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
