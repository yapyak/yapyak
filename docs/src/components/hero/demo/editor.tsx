import type { BoxProps } from '#components/box';
import type { Language } from '#utils/tokenize';

import { useLayoutEffect, useRef, useState } from 'react';

import { Box } from '#components/box';
import { CodeBlockToken } from '#components/code-block-token';
import { tokenize } from '#utils/tokenize';

import styles from './editor.module.css';

export type Framework = 'react' | 'svelte' | 'vue';

interface FrameworkConfig {
  filename: string;
  id: Framework;
  label: string;
  language: Language;
}

export const FRAMEWORKS: [FrameworkConfig, FrameworkConfig, FrameworkConfig] = [
  { filename: 'app.tsx', id: 'react', label: 'React', language: 'tsx' },
  { filename: 'app.vue', id: 'vue', label: 'Vue', language: 'vue' },
  { filename: 'app.svelte', id: 'svelte', label: 'Svelte', language: 'svelte' },
];

export interface HeroDemoEditorProps extends BoxProps {
  framework: Framework;
  isSaving: boolean;
  isTyping: boolean;
  onFrameworkChange: (framework: Framework) => void;
  source: string;
}

const CARET_MARKER = 'CARET';
const T_NAME = 't';

interface IndicatorState {
  width: number;
  x: number;
}

export function HeroDemoEditor(props: HeroDemoEditorProps) {
  const {
    className,
    framework,
    isSaving,
    isTyping,
    onFrameworkChange,
    source,
    ...restProps
  } = props;
  const config =
    FRAMEWORKS.find((entry) => entry.id === framework) ?? FRAMEWORKS[0];
  const code = buildCode(framework, source);
  const tokens = tokenize(code, config.language);

  const tabsElement = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const $tabsElement = tabsElement.current;
    if (!$tabsElement) {
      return;
    }
    const activeTabElement = $tabsElement.querySelector('[data-active]');
    if (!(activeTabElement instanceof HTMLElement)) {
      return;
    }
    setIndicator({
      width: activeTabElement.offsetWidth,
      x: activeTabElement.offsetLeft,
    });
    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [framework]);

  return (
    <Box
      {...restProps}
      className={[styles.HeroDemoEditor, className]}
      data-saving={isSaving}
      style={
        indicator
          ? {
              '--hero-demo-editor-tab-indicator-width': `${indicator.width}px`,
              '--hero-demo-editor-tab-indicator-x': `${indicator.x}px`,
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
            data-ready={isReady}
          />
        )}
        {FRAMEWORKS.map((entry) => {
          const isActive = entry.id === framework;
          const isDirty = isActive && (isTyping || isSaving);
          return (
            <Box
              as="button"
              className={styles.TabButton}
              data-active={isActive}
              key={entry.id}
              onClick={() => onFrameworkChange(entry.id)}
              type="button"
            >
              <Box
                as="span"
                className={styles.TabFilenameText}
              >
                {entry.filename}
              </Box>
              <Box
                aria-hidden="true"
                as="span"
                className={styles.TabDot}
                data-dirty={isDirty}
              />
            </Box>
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
              token.type === 'tx-source' &&
              token.value.includes(CARET_MARKER)
            ) {
              const inner = token.value.slice(1, -1);
              const parts = inner.split(CARET_MARKER);
              const before = parts[0] ?? '';
              const after = parts[1] ?? '';
              return (
                <CodeBlockToken
                  key={index}
                  type="tx-source"
                >
                  <Box as="span">'</Box>
                  {before}
                  <Box
                    aria-hidden="true"
                    as="span"
                    className={styles.Caret}
                    data-typing={isTyping}
                  />
                  {after}
                  <Box as="span">'</Box>
                </CodeBlockToken>
              );
            }
            return (
              <CodeBlockToken
                key={index}
                type={token.type}
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

function buildCode(framework: Framework, source: string): string {
  const safe = source.replace(/'/g, "\\'");
  const value = `${safe}${CARET_MARKER}`;
  switch (framework) {
    case 'react':
      return `import { ${T_NAME} } from 'yapyak';

export function Welcome() {
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
  }
}
