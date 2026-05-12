import { createFileRoute } from '@tanstack/react-router';
import { t } from 'yapyak';
import { FeatureBlock } from '#components/feature-block';
import { FrameworkRow } from '#components/framework-row';
import { Hero } from '#components/hero';
import autoTranslateCode from './-examples/auto-translate.example?raw';
import byokCode from './-examples/byok.example?raw';
import sourceAsKeyCode from './-examples/source-as-key.example?raw';
import typeSafeCode from './-examples/type-safe.example?raw';

export const Route = createFileRoute('/')({
  component: Component,
});

function Component() {
  return (
    <main>
      <Hero
        heading={t('The i18n Library for Vite apps')}
        description={t(
          'yapyak is a self-maintaining i18n library that translates your strings as you save.',
        )}
      />
      <FrameworkRow />
      <FeatureBlock
        title={t('Auto-translation on save')}
        description={t(
          'Edit a string, save the file, and every locale updates via HMR. In your voice, with the call site as context. Finally, i18n that ships as fast as you do.',
        )}
        code={autoTranslateCode}
        lang="tsx"
      />
      <FeatureBlock
        title={t('The source string is the key')}
        description={t(
          'No keys file. No abstract IDs to look up. The English text you write is the translation key, and lives co-located with your code.',
        )}
        code={sourceAsKeyCode}
        lang="tsx"
        reverse
      />
      <FeatureBlock
        title={t('Type-safe params from the source string')}
        description={t(
          'TypeScript reads the source string itself and demands the params it sees. Plurals need numbers. Dates need Dates. Forget a placeholder and the compiler stops you.',
        )}
        code={typeSafeCode}
        lang="ts"
      />
      <FeatureBlock
        title={t('Your AI, your bill')}
        description={t(
          'Pick from Anthropic, OpenAI, Gemini, Ollama — or write your own translator in 30 lines. Your key, your bill, no middleman. Each string runs once and caches.',
        )}
        code={byokCode}
        lang="ts"
        reverse
      />
    </main>
  );
}
