export interface Feature {
  accent?: 'mint';
  description: string;
  number: string;
  title: string;
}

export const FEATURES: Feature[] = [
  {
    description:
      'Edit. Save. Done. Every locale updates via HMR before you blink. There is no second step.',
    number: '01',
    title: 'Auto-translation on save',
  },
  {
    accent: 'mint',
    description:
      "What Tailwind did for class names, yapyak did for keys. Just write t('Save changes'). No IDs, no namespaces, no en.json — your English never leaves the source. AI loves it too: nothing to invent, nothing to sync.",
    number: '02',
    title: 'Source string is the key',
  },
  {
    description:
      'Every design decision serves the agent loop. t() extracts at save. Renames migrate translations. The CLI scripts cleanly. Claude Code, Cursor, Codex — they write code, yapyak handles i18n.',
    number: '03',
    title: 'Built for agentic workflows',
  },
  {
    description:
      'The translator sees the component, the element, and the surrounding code. Set a voice ("friendly", "terse", "lawyer at a dinner party"). Pin glossary terms so "Cart" stays "Korg" — even when the AI thinks it knows better.',
    number: '04',
    title: 'Context-aware AI translation',
  },
  {
    description:
      'Forget a {count} placeholder and TypeScript stops you before your tech lead does. Source-as-keys means types live on the call site. Same speed at 50 strings or 50,000.',
    number: '05',
    title: 'Type-safe params',
  },
  {
    description:
      'Every Intl primitive: plurals, dates, numbers, lists, ordinals. Yes, all four Polish plural forms.',
    number: '06',
    title: 'Feature-complete intl',
  },
  {
    description:
      'Each call site embeds its locale variants inline. Vite route-splits your app; translations split with the routes that use them. A page ships only the strings it renders.',
    number: '07',
    title: 'Translations ride with your code',
  },
  {
    description:
      'Anthropic, OpenAI, Gemini, Ollama out of the box. A custom one in 30 lines. Or skip AI entirely and fill the JSON yourself — old habits are welcome.',
    number: '08',
    title: 'Bring your own AI. Or none.',
  },
  {
    description:
      'If Vite runs it, yapyak runs with it. SSR adapters for TanStack Start and SvelteKit, more on the way. Next.js? Open a PR.',
    number: '09',
    title: 'Framework adapters',
  },
  {
    description:
      'No dashboard. No login. No "Contact sales". Other i18n services mark up your AI bill 5x. We never see your tokens. Just a library on npm. MIT.',
    number: '10',
    title: 'No lock-in. No cloud. No AI margin.',
  },
];
