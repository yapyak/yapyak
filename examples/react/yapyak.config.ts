import type { YapyakConfig } from '@yapyak/vite/config';

import { anthropic } from '@yapyak/anthropic';

export default {
  detectAcceptLanguage: true,
  persistence: 'cookie',
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    voice: 'Casual, friendly, conversational.',
  }),
} satisfies YapyakConfig;
