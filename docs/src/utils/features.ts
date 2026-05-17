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
    description:
      "What Tailwind did for class names, yapyak did for keys. Just write t('Save changes') — the English is your key, your value, your single source of truth. AI doesn't have to invent identifiers either.",
    number: '02',
    title: 'Source string is the key',
  },
  {
    description:
      'Other libraries treat translations as data. Yapyak treats them as code — inlined at each call site, split with your routes by Vite, the locale toggle paints in the same frame as the click.',
    number: '03',
    title: 'Translations as code, not data',
  },
  {
    description:
      'The translator sees the component, the element, and the surrounding code. Set a voice ("friendly", "terse", "lawyer at a dinner party"). Pin glossary terms so "Cart" stays "Korg" — even when the AI thinks it knows better.',
    number: '04',
    title: 'Context-aware AI translation',
  },
  {
    description:
      'Anthropic, OpenAI, Gemini, Ollama out of the box. A custom one in 30 lines. Or skip AI entirely and fill the JSON yourself — old habits are welcome.',
    number: '05',
    title: 'Bring your own AI. Or none.',
  },
  {
    description:
      'Forget a {count} placeholder and TypeScript stops you before your tech lead does. Source-as-keys means types live on the call site. Same speed at 50 strings or 50,000.',
    number: '06',
    title: 'Type-safe params',
  },
  {
    description:
      'Every Intl primitive: plurals, dates, numbers, lists, ordinals. Yes, all four Polish plural forms.',
    number: '07',
    title: 'Feature-complete intl',
  },
  {
    description:
      'React, Vue, and Svelte bindings. SSR adapters for Astro, React Router, SvelteKit, and TanStack Start. Next.js? Open a PR.',
    number: '08',
    title: 'Framework adapters',
  },
  {
    description:
      'Every design decision serves the agent loop. t() extracts at save. Renames migrate translations. The CLI scripts cleanly. Claude Code, Cursor, Codex — they write code, yapyak handles i18n.',
    number: '09',
    title: 'Built for agentic workflows',
  },
  {
    description:
      "MIT-licensed, full functionality on npm. Bring your own LLM key and pay the model provider directly. Yapyak doesn't sit between you and the AI bill; there's no upgrade tier.",
    number: '10',
    title: 'Open source, not open core',
  },
];
