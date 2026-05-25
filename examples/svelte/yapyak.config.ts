import type { YapyakConfig } from '@yapyak/vite/config';

import { openai } from '@yapyak/openai';

export default {
  defaultLocale: 'en',
  persistence: 'localStorage',
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: 'gpt-5-mini',
    voice: 'Casual, friendly, conversational.',
  }),
} satisfies YapyakConfig;
