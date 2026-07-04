import type { Language } from '#lib/tokenize';
import type { BoxProps } from '#primitives/box';

import { tokenize } from '#lib/tokenize';
import { Box } from '#primitives/box';

import styles from './hero-demo-editor.module.css';
import {
  CARET_MARKER,
  HeroDemoEditorCodeToken,
} from './hero-demo-editor-code-token';
import { HeroDemoEditorTab } from './hero-demo-editor-tab';

export type HeroDemoFramework = 'astro' | 'react' | 'svelte' | 'vue';

type FrameworkConfig = {
  filename: string;
  id: HeroDemoFramework;
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
  framework: HeroDemoFramework;
  onFrameworkChange: (framework: HeroDemoFramework) => void;
  saving: boolean;
  source: string;
  typing: boolean;
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
  const activeIndex = Math.max(
    FRAMEWORKS.findIndex((entry) => entry.id === framework),
    0,
  );
  const config = FRAMEWORKS[activeIndex] ?? FRAMEWORKS[0];
  const code = buildCode(framework, source);
  const tokens = tokenize(code, config.language);

  return (
    <Box
      {...restProps}
      className={[
        styles.HeroDemoEditor,
        className,
      ]}
      data-saving={saving}
      style={{
        '--demo-editor-tab-index': activeIndex,
      }}
    >
      <Box className={styles.TabRow}>
        <Box
          aria-hidden="true"
          as="span"
          className={styles.TabIndicatorBar}
        />
        {FRAMEWORKS.map((entry) => (
          <HeroDemoEditorTab
            activeFramework={framework}
            filename={entry.filename}
            framework={entry.id}
            key={entry.id}
            onSelect={onFrameworkChange}
            saving={saving}
            typing={typing}
          />
        ))}
      </Box>
      <Box
        as="pre"
        className={styles.PreformattedText}
      >
        <Box
          as="code"
          className={styles.Code}
        >
          {tokens.map((token, index) => (
            <HeroDemoEditorCodeToken
              key={index}
              token={token}
              typing={typing}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function buildCode(framework: HeroDemoFramework, source: string) {
  const safe = source.replace(/'/g, "\\'");
  const value = `${safe}${CARET_MARKER}`;
  switch (framework) {
    case 'astro':
      return `---
import { t } from 'yapyak';
---

<h1>{t('${value}')}</h1>
`;
    case 'react':
      return `import { t } from 'yapyak';

export function App() {
  return <h1>{t('${value}')}</h1>;
}
`;
    case 'svelte':
      return `<script>
  import { t } from 'yapyak';
</script>

<h1>{t('${value}')}</h1>
`;
    case 'vue':
      return `<script setup>
import { t } from 'yapyak'
</script>

<template>
  <h1>{{ t('${value}') }}</h1>
</template>
`;
    default:
      return '';
  }
}
