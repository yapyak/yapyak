export interface Feature {
  number: string;
  title: string;
  description: string;
  accent?: 'mint';
}

export const FEATURES: Feature[] = [
  {
    number: '01',
    title: 'Auto-translation on save',
    description:
      'Edit. Save. Done. Every locale updates via HMR before you blink. There is no second step.',
  },
  {
    number: '02',
    title: 'Source string is the key',
    description:
      "What Tailwind did for class names, yapyak did for keys. Just write t('Save changes'). No IDs, no namespaces, no en.json — your English never leaves the source. AI loves it too: nothing to invent, nothing to sync.",
    accent: 'mint',
  },
  {
    number: '03',
    title: 'Built for agentic workflows',
    description:
      'Every design decision serves the agent loop. t() extracts at save. Renames migrate translations. The CLI scripts cleanly. Claude Code, Cursor, Codex — they write code, yapyak handles i18n.',
  },
  {
    number: '04',
    title: 'Context-aware AI translation',
    description:
      'The translator sees the component, the element, and the surrounding code. Set a voice ("friendly", "terse", "lawyer at a dinner party"). Pin glossary terms so "Cart" stays "Korg" — even when the AI thinks it knows better.',
  },
  {
    number: '05',
    title: 'Type-safe params',
    description:
      'Forget a {count} placeholder and TypeScript stops you before your tech lead does.',
  },
  {
    number: '06',
    title: 'Feature-complete intl',
    description:
      'Every Intl primitive: plurals, dates, numbers, lists, ordinals. Yes, all four Polish plural forms.',
  },
  {
    number: '07',
    title: 'Translations ride with your code',
    description:
      'Inlined by Vite, shipped with the route. No translations.json. No fetch waterfall. They were already there.',
  },
  {
    number: '08',
    title: 'Bring your own AI. Or none.',
    description:
      'Anthropic, OpenAI, Gemini, Ollama out of the box. A custom one in 30 lines. Or skip AI entirely and fill the JSON yourself — old habits are welcome.',
  },
  {
    number: '09',
    title: 'Framework adapters',
    description:
      'If Vite runs it, yapyak runs with it. SSR adapters for TanStack Start and SvelteKit, more on the way. Next.js? Open a PR.',
  },
  {
    number: '10',
    title: 'No lock-in. No cloud. No AI margin.',
    description:
      'No dashboard. No login. No "Contact sales". Other i18n services mark up your AI bill 5x. We never see your tokens. Just a library on npm. MIT.',
  },
];
