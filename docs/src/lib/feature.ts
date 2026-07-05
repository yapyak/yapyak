import { t } from 'yapyak';

export type Feature = {
  description: string;
  number: string;
  title: string;
};

export function getFeatures(): Feature[] {
  return [
    {
      description: t(
        'Write t(\'Edit\'). Save. Your browser shows "Redigera" in Swedish and "Bearbeiten" in German via HMR. When "Bearbeiten" overflows your button, you see it while the layout is still yours to change.',
      ),
      number: '01',
      title: t('AI translation on save'),
    },
    {
      description: t(
        "No more inventing names for words that already say what they mean. Write t('Save changes'). The message is the source of truth. What Tailwind did for class names, yapyak does for translation keys.",
      ),
      number: '02',
      title: t('Source string is the key'),
    },
    {
      description: t(
        'Every t() is rewritten in place. Ship all locales together and Vite code-splits the translations along your routes. Or target a single locale at build time. The others are physically gone from the bundle, and plain text collapses to a string literal.',
      ),
      number: '03',
      title: t('Compiled in. Choose how much.'),
    },
    {
      description: t(
        'The AI sees the component, the element, and the surrounding code. Set a voice ("friendly", "terse", "lawyer at a dinner party"). Pin glossary terms so "cart" stays "kundvagn", even when the AI thinks it knows better. The AI learns your app\'s language from your past translations.',
      ),
      number: '04',
      title: t('Context-aware AI translation'),
    },
    {
      description: t(
        'Anthropic, OpenAI, Gemini, Ollama, shipped. A custom one in 30 lines. Or skip AI entirely and fill the JSON yourself. Old habits are welcome.',
      ),
      number: '05',
      title: t('Bring your own AI. Or none.'),
    },
    {
      description: t(
        'Forget a param and TypeScript flags it at the call site, before you save. On save, the compiler validates every locale and stops the build before a broken translation ships. At runtime, it warns about what only surfaces in the browser. 44 numbered diagnostics, each with a page, from the editor to the runtime.',
      ),
      number: '06',
      title: t('Paranoid by default'),
    },
    {
      description: t(
        'Inside t(): plurals, selects, ordinals, dates, numbers. Outside t(): a format namespace for numbers, dates, relative time, and lists. Yes, all four Polish plural forms.',
      ),
      number: '07',
      title: t('Production-ready i18n'),
    },
    {
      description: t(
        "Every supported framework is a first-class target, not a lowest-common-denominator wrapper. React, Vue, Svelte, and Astro each get their own bindings, parser, and tests, written in that framework's idioms. SSR adapters cover Astro, React Router, SvelteKit, and TanStack Start. No framework flies coach.",
      ),
      number: '08',
      title: t('Frameworks, first-class'),
    },
    {
      description: t(
        "Every design decision serves the agent loop. The agent writes t('Save changes') in ICU it already knows; yapyak extracts, translates, follows renames, and scripts from the CLI. The whole flow is files in your repo, so the agent never leaves the code for an external service. When something's wrong, it fails early with a clear message the agent can act on, even inside the TypeScript error, not a cryptic mismatch to debug.",
      ),
      number: '09',
      title: t('Built for agents'),
    },
    {
      description: t(
        "yapyak is a library, and only a library, MIT-licensed, all of it on npm. Everything runs on your machine, and your translations are files in your repo, committed to git. You own it the way you own the rest of your code. If you use a model, the only bill is its provider's. The pricing page is a 404.",
      ),
      number: '10',
      title: t('Open source, not open core'),
    },
  ];
}
