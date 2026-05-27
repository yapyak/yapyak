import type { YapyakConfig } from '@yapyak/vite/config';

export default {
  detectAcceptLanguage: true,
  persistence: 'cookie',
  syncHtmlLang: true,
} satisfies YapyakConfig;
