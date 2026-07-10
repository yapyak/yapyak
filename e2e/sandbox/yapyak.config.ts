import type { TranslateRequest } from 'yapyak/translator';

import { react } from '@yapyak/react/processor';
import { defineConfig } from 'yapyak/config';

const TRANSLATE_DELAY_MILLISECONDS = 500;

const TRANSLATIONS: Record<string, string> = {
  Cancel: 'Avbryt',
  Hello: 'Hej',
  'Loading...': 'Laddar...',
  Save: 'Spara',
  'Save changes': 'Spara ändringar',
  Settings: 'Inställningar',
  'Switch account': 'Byt konto',
  'Unnamed account': 'Namnlöst konto',
  World: 'Världen',
};

const HOMONYMS: Record<string, Record<string, string>> = {
  Open: {
    badge: 'Öppen',
    button: 'Öppna',
  },
};

export default defineConfig({
  autoTranslateThreshold: 3,
  persistence: 'local-storage',
  preserveTranslationsOnRename: true,
  processors: [
    react(),
  ],
  translator: Object.assign(
    async (request: TranslateRequest): Promise<string> => {
      await new Promise((resolve) => {
        setTimeout(resolve, TRANSLATE_DELAY_MILLISECONDS);
      });
      if (request.disambiguation) {
        return HOMONYMS[request.source]?.[request.disambiguation] ?? '';
      }
      return TRANSLATIONS[request.source] ?? '';
    },
    {
      id: 'dictionary',
    },
  ),
});
