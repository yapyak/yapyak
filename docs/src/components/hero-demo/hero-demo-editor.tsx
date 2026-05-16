import type { CSSProperties, ReactElement } from 'react';
import type { Lang } from '#lib/utils/tokenize';

import { useLayoutEffect, useRef, useState } from 'react';

import { tokenize } from '#lib/utils/tokenize';

import styles from './hero-demo-editor.module.css';

export type Framework = 'react' | 'svelte' | 'vue';

interface FrameworkConfig {
  filename: string;
  id: Framework;
  label: string;
  lang: Lang;
}

export const FRAMEWORKS: FrameworkConfig[] = [
  { filename: 'app.tsx', id: 'react', label: 'React', lang: 'tsx' },
  { filename: 'app.vue', id: 'vue', label: 'Vue', lang: 'vue' },
  { filename: 'app.svelte', id: 'svelte', label: 'Svelte', lang: 'svelte' },
];

export interface HeroDemoEditorProps {
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

export function HeroDemoEditor(props: HeroDemoEditorProps): ReactElement {
  const { source, typing, saving, framework, onFrameworkChange } = props;
  const config =
    // biome-ignore lint/style/noNonNullAssertion: yap yap yap
    FRAMEWORKS.find((entry) => entry.id === framework) ?? FRAMEWORKS[0]!;
  const code = buildCode(framework, source);
  const tokens = tokenize(code, config.lang);

  const tabsElement = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const $tabs = tabsElement.current;
    if ($tabs === null) {
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

  const indicatorStyle: CSSProperties | undefined =
    indicator !== null
      ? {
          transform: `translateX(${indicator.x}px)`,
          width: `${indicator.width}px`,
        }
      : undefined;

  return (
    <div
      className={styles.HeroDemoEditor}
      data-saving={saving || undefined}
    >
      <div
        className={styles.Tabs}
        ref={tabsElement}
      >
        {indicator !== null ? (
          <span
            aria-hidden="true"
            className={styles.TabIndicator}
            data-ready={isReady || undefined}
            style={indicatorStyle}
          />
        ) : null}
        {FRAMEWORKS.map((entry) => {
          const isActive = entry.id === framework;
          const isDirty = isActive && (typing || saving);
          return (
            <button
              className={styles.Tab}
              data-active={isActive || undefined}
              key={entry.id}
              onClick={() => onFrameworkChange(entry.id)}
              type="button"
            >
              <span className={styles.TabFilename}>{entry.filename}</span>
              <span
                aria-hidden="true"
                className={styles.TabDot}
                data-dirty={isDirty || undefined}
              />
            </button>
          );
        })}
      </div>
      <pre className={styles.Pre}>
        <code className={styles.Code}>
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
                <span
                  className="tx-tx-source"
                  key={index}
                >
                  <span>'</span>
                  {before}
                  <span
                    className={styles.Caret}
                    data-typing={typing || undefined}
                  />
                  {after}
                  <span>'</span>
                </span>
              );
            }
            return (
              <span
                className={`tx-${token.type}`}
                key={index}
              >
                {token.value}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
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
