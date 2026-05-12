import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { t } from 'yapyak';
import { FeatureBlock } from '#components/feature-block';
import { FrameworkRow } from '#components/framework-row';
import { Hero } from '#components/hero';
import autoTranslateCode from './-examples/auto-translate.example?raw';
import byokCode from './-examples/byok.example?raw';
import sourceAsKeyCode from './-examples/source-as-key.example?raw';
import typeSafeCode from './-examples/type-safe.example?raw';

const FEATURE_CODE = {
  autoTranslate: autoTranslateCode,
  sourceAsKey: sourceAsKeyCode,
  typeSafe: typeSafeCode,
  byok: byokCode,
};

const highlightAll = createServerFn({ method: 'GET' }).handler(async () => {
  const { highlight } = await import('#lib/highlight');
  const entries = await Promise.all(
    Object.entries(FEATURE_CODE).map(async ([key, code]) => {
      const html = await highlight(code, 'tsx');
      return [key, html] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<keyof typeof FEATURE_CODE, string>;
});

export const Route = createFileRoute('/')({
  async loader() {
    const code = await highlightAll();
    return { code };
  },
  component: Component,
});

function Component() {
  const { code } = Route.useLoaderData();
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
        codeHtml={code.autoTranslate}
      />
      <FeatureBlock
        title={t('The source string is the key')}
        description={t(
          'No keys file. No abstract IDs to look up. The English text you write is the translation key, and lives co-located with your code.',
        )}
        codeHtml={code.sourceAsKey}
        reverse
      />
      <FeatureBlock
        title={t('Type-safe params from the source string')}
        description={t(
          'TypeScript reads the source string itself and demands the params it sees. Plurals need numbers. Dates need Dates. Forget a placeholder and the compiler stops you.',
        )}
        codeHtml={code.typeSafe}
      />
      <FeatureBlock
        title={t('Your AI, your bill')}
        description={t(
          'Pick from Anthropic, OpenAI, Gemini, Ollama — or write your own translator in 30 lines. Your key, your bill, no middleman. Each string runs once and caches.',
        )}
        codeHtml={code.byok}
        reverse
      />
    </main>
  );
}
