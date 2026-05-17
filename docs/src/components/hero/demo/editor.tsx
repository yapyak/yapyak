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

export const FRAMEWORKS: FrameworkConfig[] = [
  { filename: 'app.tsx', id: 'react', label: 'React', language: 'tsx' },
  { filename: 'app.vue', id: 'vue', label: 'Vue', language: 'vue' },
  { filename: 'app.svelte', id: 'svelte', label: 'Svelte', language: 'svelte' },
];

export interface HeroDemoEditorProps extends BoxProps {
  framework: Framework;
  onFrameworkChange: (framework: Framework) => void;
  saving: boolean;
  source: string;
  typing: boolean;
}

const CARET_MARKER = 'CARET';
const T = 't';

interface IndicatorState {
  width: number;
  x: number;
}

export function HeroDemoEditor(props: HeroDemoEditorProps) {
  const { className, framework, onFrameworkChange, saving, source, typing } =
    props;
  const config =
    // biome-ignore lint/style/noNonNullAssertion: yap yap yap
    FRAMEWORKS.find((entry) => entry.id === framework) ?? FRAMEWORKS[0]!;
  const code = buildCode(framework, source);
  const tokens = tokenize(code, config.language);

  const tabsElement = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const $tabs = tabsElement.current;
    if (!$tabs) {
      return;
    }
    const activeTab = $tabs.querySelector('[data-active]');
    if (!(activeTab instanceof HTMLElement)) {
      return;
    }
    setIndicator({
      width: activeTab.offsetWidth,
      x: activeTab.offsetLeft,
    });
    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [framework]);

  return (
    <Box
      className={[styles.HeroDemoEditor, className]}
      data-saving={saving}
      style={
        indicator && {
          '--hero-demo-editor-tab-indicator-width': `${indicator.width}px`,
          '--hero-demo-editor-tab-indicator-x': `${indicator.x}px`,
        }
      }
    >
      <Box
        className={styles.Tabs}
        ref={tabsElement}
      >
        {indicator && (
          <Box
            aria-hidden="true"
            as="span"
            className={styles.TabIndicator}
            data-ready={isReady}
          />
        )}
        {FRAMEWORKS.map((entry) => {
          const isActive = entry.id === framework;
          const isDirty = isActive && (typing || saving);
          return (
            <Box
              as="button"
              className={styles.Tab}
              data-active={isActive}
              key={entry.id}
              onClick={() => onFrameworkChange(entry.id)}
              type="button"
            >
              <Box
                as="span"
                className={styles.TabFilename}
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
        className={styles.Pre}
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
      return `import { ${T} } from 'yapyak';

export function Welcome() {
  return <h1>{${T}('${value}')}</h1>;
}
`;
    case 'svelte':
      return `<script>
  import { ${T} } from 'yapyak';
</script>

<h1>{${T}('${value}')}</h1>
`;
    case 'vue':
      return `<script setup>
import { ${T} } from 'yapyak'
</script>

<template>
  <h1>{{ ${T}('${value}') }}</h1>
</template>
`;
  }
}
