import type { ReactElement } from 'react';
import { type Lang, tokenize } from '#lib/utils/tokenize';
import styles from './hero-demo-editor.module.css';

export type Framework = 'react' | 'svelte' | 'vue';

interface FrameworkConfig {
  id: Framework;
  label: string;
  filename: string;
  lang: Lang;
}

export const FRAMEWORKS: FrameworkConfig[] = [
  { id: 'react', label: 'React', filename: 'app.tsx', lang: 'tsx' },
  { id: 'svelte', label: 'Svelte', filename: 'app.svelte', lang: 'svelte' },
  { id: 'vue', label: 'Vue', filename: 'app.vue', lang: 'vue' },
];

export interface HeroDemoEditorProps {
  source: string;
  typing: boolean;
  framework: Framework;
  onFrameworkChange: (framework: Framework) => void;
}

const CARET_MARKER = 'CARET';
const T = 't';

export function HeroDemoEditor(props: HeroDemoEditorProps): ReactElement {
  const { source, typing, framework, onFrameworkChange } = props;
  const config = FRAMEWORKS.find((entry) => entry.id === framework) ?? FRAMEWORKS[0]!;
  const code = buildCode(framework, source);
  const tokens = tokenize(code, config.lang);

  return (
    <div className={styles.HeroDemoEditor}>
      <div className={styles.Tabs}>
        {FRAMEWORKS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={styles.Tab}
            data-active={entry.id === framework || undefined}
            onClick={() => onFrameworkChange(entry.id)}
          >
            <span className={styles.TabFilename}>{entry.filename}</span>
            <span
              className={styles.TabDot}
              data-dirty={(entry.id === framework && typing) || undefined}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <pre className={styles.Pre}>
        <code className={styles.Code}>
          {tokens.map((token, index) => {
            if (token.type === 'tx-source' && token.value.includes(CARET_MARKER)) {
              const inner = token.value.slice(1, -1);
              const parts = inner.split(CARET_MARKER);
              const before = parts[0] ?? '';
              const after = parts[1] ?? '';
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable per render
                  key={index}
                  className="tx-tx-source"
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
                // biome-ignore lint/suspicious/noArrayIndexKey: stable per render
                key={index}
                className={`tx-${token.type}`}
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
import { ${T} } from 'yapyak';
</script>

<template>
  <h1>{{ ${T}('${value}') }}</h1>
</template>
`;
  }
}
