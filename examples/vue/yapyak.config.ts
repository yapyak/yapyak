import type { YapyakConfig } from '@yapyak/vite/config';

import { ollama } from '@yapyak/ollama';

export default {
  persistence: { name: 'app-locale', type: 'cookie' },
  syncHtmlLang: true,
  translator: ollama({
    model: 'llama3.1',
    voice: 'Direct, no marketing fluff.',
  }),
} satisfies YapyakConfig;
