import type { BoxProps } from '#components/box';

import { t } from 'yapyak';

import { Box } from '#components/box';

import { FeatureSectionItem } from './feature-section/item';
import styles from './feature-section.module.css';

export interface Feature {
  description: string;
  number: string;
  title: string;
}

export interface FeatureSectionProps extends BoxProps<'section'> {}

export function FeatureSection(props: FeatureSectionProps) {
  const { className, ...restProps } = props;

  const features: Feature[] = [
    {
      description: t(
        'Edit. Save. Done. Every locale updates via HMR before you blink. There is no second step.',
      ),
      number: '01',
      title: t('Auto-translation on save'),
    },
    {
      description: t(
        "What Tailwind did for class names, yapyak did for keys. Just write t('Save changes') — the English is your key, your value, your single source of truth. AI doesn't have to invent identifiers either.",
      ),
      number: '02',
      title: t('Source string is the key'),
    },
    {
      description: t(
        'Other libraries treat translations as data: a dictionary loaded at runtime, looked up on every call. Yapyak treats them as code — each call site compiles to a literal with every locale variant inlined. The bundle splits with your routes. The model that ships 20 languages is the same as the one that ships 2.',
      ),
      number: '03',
      title: t('Translations as code, not data'),
    },
    {
      description: t(
        'The translator sees the component, the element, and the surrounding code. Set a voice ("friendly", "terse", "lawyer at a dinner party"). Pin glossary terms so "Cart" stays "Korg" — even when the AI thinks it knows better.',
      ),
      number: '04',
      title: t('Context-aware AI translation'),
    },
    {
      description: t(
        'Anthropic, OpenAI, Gemini, Ollama out of the box. A custom one in 30 lines. Or skip AI entirely and fill the JSON yourself — old habits are welcome.',
      ),
      number: '05',
      title: t('Bring your own AI. Or none.'),
    },
    {
      description: t(
        'Forget a {count} placeholder and TypeScript stops you before your tech lead does. Source-as-keys means types live on the call site. Same speed at 50 strings or 50,000.',
      ),
      number: '06',
      title: t('Type-safe params'),
    },
    {
      description: t(
        'Every Intl primitive: plurals, dates, numbers, lists, ordinals. Yes, all four Polish plural forms.',
      ),
      number: '07',
      title: t('Feature-complete intl'),
    },
    {
      description: t(
        'React, Vue, and Svelte bindings. SSR adapters for Astro, React Router, SvelteKit, and TanStack Start. Next.js? Open a PR.',
      ),
      number: '08',
      title: t('Framework adapters'),
    },
    {
      description: t(
        'Every design decision serves the agent loop. t() extracts at save. Renames migrate translations. The CLI scripts cleanly. Claude Code, Cursor, Codex — they write code, yapyak handles i18n.',
      ),
      number: '09',
      title: t('Built for agentic workflows'),
    },
    {
      description: t(
        "MIT-licensed, full functionality on npm. Bring your own LLM key and pay the model provider directly. yapyak doesn't sit between you and the AI bill; there's no upgrade tier.",
      ),
      number: '10',
      title: t('Open source, not open core'),
    },
  ];

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.FeatureSection, className]}
    >
      <Box
        aria-hidden="true"
        className={styles.Divider}
      />
      <Box
        as="ol"
        className={styles.List}
      >
        {features.map((feature) => (
          <FeatureSectionItem
            feature={feature}
            key={feature.number}
          />
        ))}
      </Box>
    </Box>
  );
}
