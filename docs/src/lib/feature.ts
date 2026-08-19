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
        "No more inventing names for words that already say what they mean. Write t('Save changes') — the message is the source of truth. What Tailwind did for class names, yapyak does for translation keys.",
      ),
      number: '01',
      title: t('Source string is the key'),
    },
    {
      description: t(
        'Write t(\'Edit\'). Save. Your browser shows "Editar" in Portuguese and "Bearbeiten" in German via HMR. When "Bearbeiten" overflows your button, you catch it while the layout is still yours to change.',
      ),
      number: '02',
      title: t('AI translation on save'),
    },
    {
      description: t(
        'No message gets translated in a vacuum. The model sees the component it appears in, the element wrapping it, and the code beside it. Set a voice ("friendly", "terse", "lawyer at a dinner party"). Pin glossary terms so "cart" stays "kundvagn", even when the model thinks it knows better. The model learns your app\'s language from your past translations.',
      ),
      number: '03',
      title: t('Context-aware AI translation'),
    },
    {
      description: t(
        "Rename the file, move the component, or paste the markup somewhere new, and the translations come with it. Delete a component and its translations don't vanish; bring it back and they're waiting. The compiler will never overwrite a locale file in a way that quietly drops a translation you still use.",
      ),
      number: '04',
      title: t('Refactor freely'),
    },
    {
      description: t(
        'Forget a param and TypeScript catches it at the call site, before you even save. Save, and yapyak checks every locale, refusing to ship a translation that drifted or lost a plural. In the browser, it warns about the failures that build time never sees. Numbered diagnostics, YAP0001 and up, each with a page that spells out the fix.',
      ),
      number: '05',
      title: t('Paranoid by default'),
    },
    {
      description: t(
        'Inside t(): plurals, selects, ordinals, dates, numbers, and rich text that renders your own components inside a message. Outside t(): a format namespace for numbers, dates, relative time, and lists. Yes, all four Polish plural forms.',
      ),
      number: '06',
      title: t('Production-ready i18n'),
    },
    {
      description: t(
        'The compiler rewrites every t() in place. Ship all locales together and Vite code-splits the translations along your routes. Or target a single locale at build time. The others are physically gone from the bundle, and plain text collapses to a string literal.',
      ),
      number: '07',
      title: t('Compiled in. Choose how much.'),
    },
    {
      description: t(
        "Switch the locale and it swaps instantly: the translations are already in the bundle, so there's nothing to fetch and no spinner. Persist the choice in a cookie, the URL, or local storage. On the server, each request gets its own locale, so one user's language never bleeds into another's.",
      ),
      number: '08',
      title: t('Locale switching, handled'),
    },
    {
      description: t(
        'Every supported framework is a first-class target, not a lowest-common-denominator wrapper. React, Vue, Svelte, and Astro each get their own bindings, parser, and tests. SSR adapters cover Astro, React Router, SvelteKit, and TanStack Start. No framework flies coach.',
      ),
      number: '09',
      title: t('Frameworks, first-class'),
    },
    {
      description: t(
        'Anthropic, OpenAI, Gemini, Ollama — shipped. A custom one is 30 lines: implement one function that returns the translation. Run the model in the cloud, on your own box with Ollama, or skip AI entirely and fill the JSON yourself. Old habits are welcome.',
      ),
      number: '10',
      title: t('Bring your own AI. Or none.'),
    },
    {
      description: t(
        "Every design decision serves the agent loop. The agent writes t('Save changes') in ICU it already knows; yapyak extracts, translates, and scripts from the CLI. The whole flow is files in your repo, so the agent never leaves the code for an external service. When something's wrong, the error is clear and early, even inside the TypeScript error, so the agent fixes it instead of debugging.",
      ),
      number: '11',
      title: t('Built for agents'),
    },
    {
      description: t(
        "yapyak ships a VS Code extension, Cursor and the other forks included. Hover t('Save changes') and every locale is right there, the ICU inside is highlighted, and a misspelled placeholder gets a red squiggle with the fix one keystroke away. Have the model translate or retranslate a locale file without leaving the editor. Same compiler as your build, so the editor, the build, and CI never disagree.",
      ),
      number: '12',
      title: t('Editor DX, taken seriously'),
    },
  ];
}
