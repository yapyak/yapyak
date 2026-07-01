import type { TransitionEvent } from 'react';
import type { Language } from '#lib/tokenize';
import type { BoxProps } from '#primitives/box';

import { useLayoutEffect, useRef, useState } from 'react';

import { CodeBlockToken } from '#components/code-block-token';
import { tokenize } from '#lib/tokenize';
import { Box } from '#primitives/box';

import styles from './hero-demo-editor.module.css';
import { HeroDemoEditorTab } from './hero-demo-editor-tab';

export type Framework = 'astro' | 'react' | 'svelte' | 'vue';

type FrameworkConfig = {
  filename: string;
  id: Framework;
  label: string;
  language: Language;
};

export const FRAMEWORKS: [
  FrameworkConfig,
  FrameworkConfig,
  FrameworkConfig,
  FrameworkConfig,
] = [
  {
    filename: 'app.tsx',
    id: 'react',
    label: 'React',
    language: 'tsx',
  },
  {
    filename: 'app.vue',
    id: 'vue',
    label: 'Vue',
    language: 'vue',
  },
  {
    filename: 'app.svelte',
    id: 'svelte',
    label: 'Svelte',
    language: 'svelte',
  },
  {
    filename: 'app.astro',
    id: 'astro',
    label: 'Astro',
    language: 'astro',
  },
];

export type HeroDemoEditorProps = BoxProps & {
  framework: Framework;
  onFrameworkChange: (framework: Framework) => void;
  saving: boolean;
  source: string;
  typing: boolean;
};

const CARET_MARKER = 'CARET';
const T_NAME = 't';

type IndicatorState = {
  width: number;
  x: number;
};

export function HeroDemoEditor(props: HeroDemoEditorProps) {
  const {
    className,
    framework,
    saving,
    typing,
    onFrameworkChange,
    source,
    ...restProps
  } = props;
  const config =
    FRAMEWORKS.find((entry) => entry.id === framework) ?? FRAMEWORKS[0];
  const code = buildCode(framework, source);
  const tokens = tokenize(code, config.language);

  const tabsElement = useRef<HTMLDivElement>(null);
  const previousFrameworkRef = useRef<Framework | null>(null);
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useLayoutEffect(() => {
    const $tabsElement = tabsElement.current;
    if ($tabsElement === null) {
      return;
    }
    const updateIndicator = () => {
      const activeTabElement = $tabsElement.querySelector('[data-active]');
      if (!(activeTabElement instanceof HTMLElement)) {
        return;
      }
      const hasPreviousTab =
        activeTabElement.previousElementSibling?.tagName === 'BUTTON';
      const extraLeft = hasPreviousTab ? 1 : 0;
      setIndicator({
        width: activeTabElement.offsetWidth + extraLeft,
        x: activeTabElement.offsetLeft - extraLeft,
      });
    };
    updateIndicator();
    if (
      previousFrameworkRef.current !== null &&
      previousFrameworkRef.current !== framework
    ) {
      setIsAnimating(true);
    }
    previousFrameworkRef.current = framework;
    const observer = new ResizeObserver(updateIndicator);
    for (const tabElement of $tabsElement.querySelectorAll('button')) {
      observer.observe(tabElement);
    }
    return () => {
      observer.disconnect();
    };
  }, [
    framework,
  ]);

  const handleIndicatorTransitionEnd = (
    event: TransitionEvent<HTMLSpanElement>,
  ) => {
    if (event.propertyName !== 'transform') {
      return;
    }
    setIsAnimating(false);
  };

  return (
    <Box
      {...restProps}
      className={[
        styles.HeroDemoEditor,
        className,
      ]}
      data-animating={isAnimating}
      data-saving={saving}
      style={
        indicator
          ? {
              '--demo-editor-tab-indicator-width': `${indicator.width}px`,
              '--demo-editor-tab-indicator-x': `${indicator.x}px`,
            }
          : undefined
      }
    >
      <Box
        className={styles.TabRow}
        ref={tabsElement}
      >
        {indicator && (
          <Box
            aria-hidden="true"
            as="span"
            className={styles.TabIndicatorBar}
            onTransitionEnd={handleIndicatorTransitionEnd}
          />
        )}
        {FRAMEWORKS.map((entry) => {
          const isActive = entry.id === framework;
          const isDirty = isActive && (typing || saving);
          return (
            <HeroDemoEditorTab
              active={isActive}
              dirty={isDirty}
              filename={entry.filename}
              framework={entry.id}
              key={entry.id}
              onSelect={onFrameworkChange}
            />
          );
        })}
      </Box>
      <Box
        as="pre"
        className={styles.PreformattedText}
      >
        <Box
          as="code"
          className={styles.Code}
        >
          {tokens.map((token, index) => {
            if (
              token.kind === 'tx-source' &&
              token.value.includes(CARET_MARKER)
            ) {
              const inner = token.value.slice(1, -1);
              const parts = inner.split(CARET_MARKER);
              const before = parts[0] ?? '';
              const after = parts[1] ?? '';
              return (
                <CodeBlockToken
                  key={index}
                  kind="tx-source"
                >
                  <Box as="span">'</Box>
                  {before}
                  <Box
                    aria-hidden="true"
                    as="span"
                    className={styles.Caret}
                    data-typing={typing}
                  />
                  {after}
                  <Box as="span">'</Box>
                </CodeBlockToken>
              );
            }
            return (
              <CodeBlockToken
                key={index}
                kind={token.kind}
              >
                {token.value}
              </CodeBlockToken>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function buildCode(framework: Framework, source: string) {
  const safe = source.replace(/'/g, "\\'");
  const value = `${safe}${CARET_MARKER}`;
  switch (framework) {
    case 'astro':
      return `---
import { ${T_NAME} } from 'yapyak';
---

<h1>{${T_NAME}('${value}')}</h1>
`;
    case 'react':
      return `import { ${T_NAME} } from 'yapyak';

export function App() {
  return <h1>{${T_NAME}('${value}')}</h1>;
}
`;
    case 'svelte':
      return `<script>
  import { ${T_NAME} } from 'yapyak';
</script>

<h1>{${T_NAME}('${value}')}</h1>
`;
    case 'vue':
      return `<script setup>
import { ${T_NAME} } from 'yapyak'
</script>

<template>
  <h1>{{ ${T_NAME}('${value}') }}</h1>
</template>
`;
    default:
      return '';
  }
}
