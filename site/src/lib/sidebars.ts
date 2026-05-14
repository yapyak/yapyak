export type SidebarNode = SidebarGroup | SidebarLink;

export interface SidebarGroup {
  type: 'group';
  title: string;
  href?: string;
  items: SidebarNode[];
  collapsed?: boolean;
}

export interface SidebarLink {
  type: 'link';
  title: string;
  href: string;
}

export const guideSidebar: SidebarNode[] = [
  {
    type: 'group',
    title: 'Getting Started',
    items: [
      { type: 'link', title: 'Introduction', href: '/guide/introduction' },
      { type: 'link', title: 'Installation', href: '/guide/installation' },
      { type: 'link', title: 'How it works', href: '/guide/how-it-works' },
    ],
  },
  {
    type: 'group',
    title: 'Core',
    items: [
      {
        type: 'link',
        title: 'Translations',
        href: '/guide/translations',
      },
      {
        type: 'link',
        title: 'Locales',
        href: '/guide/locales',
      },
      {
        type: 'group',
        title: 'Adapters',
        href: '/guide/adapters',
        items: [
          {
            type: 'link',
            title: 'TanStack Start',
            href: '/guide/adapters/tanstack-start',
          },
          {
            type: 'link',
            title: 'SvelteKit',
            href: '/guide/adapters/sveltekit',
          },
          {
            type: 'link',
            title: 'Custom',
            href: '/guide/adapters/custom',
          },
        ],
      },
      {
        type: 'group',
        title: 'Translators',
        href: '/guide/translators',
        items: [
          {
            type: 'link',
            title: 'Anthropic',
            href: '/guide/translators/anthropic',
          },
          {
            type: 'link',
            title: 'OpenAI',
            href: '/guide/translators/openai',
          },
          {
            type: 'link',
            title: 'Gemini',
            href: '/guide/translators/gemini',
          },
          {
            type: 'link',
            title: 'Ollama',
            href: '/guide/translators/ollama',
          },
          {
            type: 'link',
            title: 'Custom',
            href: '/guide/translators/custom',
          },
        ],
      },
    ],
  },
];
