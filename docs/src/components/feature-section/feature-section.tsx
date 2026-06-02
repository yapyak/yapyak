import type { BoxProps } from '#components/box';

import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './feature-section.module.css';
import { FeatureSectionItem } from './feature-section-item';

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
        'Write t(\'Edit\'). Save. Your browser shows "Redigera" in Swedish and "Bearbeiten" in German via HMR. When "Bearbeiten" overflows your button, you see it while the layout is still yours to change.',
      ),
      number: '01',
      title: t('Auto-translation on save'),
    },
    {
      description: t(
        "What Tailwind did for class names, yapyak does for translation keys. No more inventing names for words that already say what they mean. Write t('Save changes') — the message is the source of truth.",
      ),
      number: '02',
      title: t('Source string is the key'),
    },
    {
      description: t(
        'Every t() is rewritten in place. Ship all locales together and Vite code-splits the catalogs along your routes. Or target a single locale at build time — the others are physically gone from the bundle, and plain text collapses to a string literal.',
      ),
      number: '03',
      title: t('Translations compile in. Choose how much.'),
    },
    {
      description: t(
        'The translator sees the component, the element, and the surrounding code. Set a voice ("friendly", "terse", "lawyer at a dinner party"). Pin glossary terms so "Cart" stays "Korg", even when the AI thinks it knows better. The AI learns your app\'s language from every past translation.',
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
        'Forget a placeholder param and TypeScript stops you before your tech lead does. Source-as-keys means types live on the call site. Same speed at 50 strings or 50,000.',
      ),
      number: '06',
      title: t('Type-safe params'),
    },
    {
      description: t(
        'Inside t(): plurals, dates, numbers, lists, ordinals. Outside t(): a format namespace with eight helpers from currency to relative time. Yes, all four Polish plural forms.',
      ),
      number: '07',
      title: t('Production-ready intl'),
    },
    {
      description: t(
        'React, Vue, and Svelte bindings. SSR adapters for Astro, React Router, SvelteKit, and TanStack Start. Each gets its own parser, bindings, and tests.',
      ),
      number: '08',
      title: t('Frameworks, first-class'),
    },
    {
      description: t(
        'Every design decision serves the agent loop. For an AI agent, each t() carries the whole message at the call site. Renames migrate translations, extractions happen at save, the CLI scripts cleanly. Your agent writes the code. yapyak does the rest.',
      ),
      number: '09',
      title: t('Built for agents'),
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
