import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './swatch.module.css';

export type SwatchAccent =
  | 'anthropic'
  | 'astro'
  | 'bun'
  | 'chatgpt'
  | 'claude'
  | 'cursor'
  | 'gemini'
  | 'none'
  | 'npm'
  | 'nuxt'
  | 'ollama'
  | 'openai'
  | 'pnpm'
  | 'react'
  | 'react-router'
  | 'svelte'
  | 'sveltekit'
  | 't3-chat'
  | 'tanstack-start'
  | 'vue';

export type SwatchProps = BoxProps & {
  accent: SwatchAccent;
};

export function Swatch(props: SwatchProps) {
  const { accent, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      aria-hidden={true}
      className={[
        styles.Swatch,
        className,
      ]}
      data-accent={accent}
    />
  );
}
