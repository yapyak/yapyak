import type { YapyakConfig } from '@yapyak/vite/config';

export default {
  persistence: { name: 'app-locale', type: 'cookie' },
  syncHtmlLang: true,
} satisfies YapyakConfig;
