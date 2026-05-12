export type SidebarNode = SidebarGroup | SidebarLink;

export interface SidebarGroup {
  type: 'group';
  title: string;
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
      {
        type: 'link',
        title: 'Installation',
        href: '/guide/installation',
      },
      {
        type: 'link',
        title: 'Quick start',
        href: '/guide/quick-start',
      },
    ],
  },
  {
    type: 'group',
    title: 'Frameworks',
    items: [
      {
        type: 'link',
        title: 'React',
        href: '/guide/react',
      },
      {
        type: 'link',
        title: 'Vue',
        href: '/guide/vue',
      },
      {
        type: 'link',
        title: 'Svelte',
        href: '/guide/svelte',
      },
      {
        type: 'group',
        title: 'SSR',
        items: [
          {
            type: 'link',
            title: 'TanStack Start',
            href: '/guide/tanstack-start',
          },
          {
            type: 'link',
            title: 'SvelteKit',
            href: '/guide/sveltekit',
          },
        ],
      },
    ],
  },
  {
    type: 'group',
    title: 'AI translation',
    items: [
      {
        type: 'link',
        title: 'Translators',
        href: '/guide/translators',
      },
      {
        type: 'link',
        title: 'Context-aware prompts',
        href: '/guide/context',
      },
    ],
  },
];
