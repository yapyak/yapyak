import { defineConfig } from 'vitepress';
import { generateSidebar } from 'vitepress-sidebar';

const sidebar = generateSidebar([
  {
    collapsed: false,
    documentRootPath: '.',
    frontmatterOrderDefaultValue: 999,
    resolvePath: '/guide/',
    scanStartPath: 'guide',
    sortMenusByFrontmatterOrder: true,
    useFolderLinkFromIndexFile: true,
    useFolderTitleFromIndexFile: true,
    useTitleFromFileHeading: true,
  },
]) as Record<string, { items: { text: string }[] }>;

export default defineConfig({
  cleanUrls: true,
  description: 'i18n that doesn’t suck. Let your app yak in any language.',
  head: [
    ['meta', { content: 'website', property: 'og:type' }],
    ['meta', { content: 'yapyak', property: 'og:title' }],
    [
      'meta',
      {
        content: 'i18n that doesn’t suck. Let your app yak in any language.',
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
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      {
        text: 'GitHub',
        link: 'https://github.com/yapyak/yapyak',
      },
    ],
    search: {
      provider: 'local',
    },
    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yapyak/yapyak' },
    ],
  },
  title: 'yapyak',
});
