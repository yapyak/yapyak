import { defineConfig } from 'vitepress';

export default defineConfig({
  cleanUrls: true,
  description:
    'i18n where your code is the source of truth. Translations are side-effects.',
  head: [
    ['meta', { content: 'website', property: 'og:type' }],
    ['meta', { content: 'yapyak', property: 'og:title' }],
    [
      'meta',
      {
        content:
          'i18n where your code is the source of truth. Translations are side-effects.',
        property: 'og:description',
      },
    ],
  ],
  lastUpdated: true,
  markdown: {
    headers: {
      level: [2, 3],
    },
    lineNumbers: false,
  },
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/yapyak/yapyak/edit/main/docs/:path',
    },
    externalLinkIcon: true,
    footer: {
      copyright: 'Copyright 2026-present',
      message: 'Released under the MIT License.',
    },
    lastUpdated: {
      text: 'Last updated',
    },
    nav: [
      { activeMatch: '/guide/', link: '/guide/introduction', text: 'Guide' },
      {
        link: 'https://github.com/yapyak/yapyak',
        text: 'GitHub',
      },
    ],
    outline: [2, 3],
    search: {
      provider: 'local',
    },
    sidebar: {
      '/guide/': [
        {
          items: [
            { link: '/guide/introduction', text: 'Introduction' },
            { link: '/guide/installation', text: 'Installation' },
            { link: '/guide/how-it-works', text: 'How it works' },
          ],
          text: 'Getting Started',
        },
        {
          items: [
            {
              collapsed: false,
              items: [
                {
                  link: '/guide/translations/auto-translation',
                  text: 'Auto-translation',
                },
                {
                  link: '/guide/translations/manual-translation',
                  text: 'Manual translation',
                },
              ],
              link: '/guide/translations/',
              text: 'Translations',
            },
            { link: '/guide/locales/', text: 'Locales' },
            {
              collapsed: false,
              items: [
                {
                  link: '/guide/adapters/tanstack-start/',
                  text: 'TanStack Start',
                },
                { link: '/guide/adapters/sveltekit/', text: 'SvelteKit' },
                { link: '/guide/adapters/custom/', text: 'Custom' },
              ],
              link: '/guide/adapters/',
              text: 'Adapters',
            },
            {
              collapsed: false,
              items: [
                { link: '/guide/translators/anthropic/', text: 'Anthropic' },
                { link: '/guide/translators/openai/', text: 'OpenAI' },
                { link: '/guide/translators/gemini/', text: 'Gemini' },
                { link: '/guide/translators/ollama/', text: 'Ollama' },
                { link: '/guide/translators/custom/', text: 'Custom' },
              ],
              link: '/guide/translators/',
              text: 'Translators',
            },
          ],
          text: 'Core',
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yapyak/yapyak' },
    ],
  },
  title: 'yapyak',
});
