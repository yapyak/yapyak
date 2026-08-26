import type { TranslateRequest } from 'yapyak/translator';

import { react } from '@yapyak/react/processor';
import { defineConfig } from 'yapyak/config';

const TRANSLATE_DELAY_MILLISECONDS = 500;

const TRANSLATIONS_BY_LOCALE: Record<string, Record<string, string>> = {
  de: {
    Cancel: 'Abbrechen',
    Hello: 'Hallo',
    'Loading...': 'Lädt...',
    Save: 'Speichern',
    'Save changes': 'Änderungen speichern',
    Settings: 'Einstellungen',
    'Switch account': 'Konto wechseln',
    'Unnamed account': 'Unbenanntes Konto',
    World: 'Welt',
  },
  sv: {
    Cancel: 'Avbryt',
    Hello: 'Hej',
    'Loading...': 'Laddar...',
    Save: 'Spara',
    'Save changes': 'Spara ändringar',
    Settings: 'Inställningar',
    'Switch account': 'Byt konto',
    'Unnamed account': 'Namnlöst konto',
    World: 'Världen',
  },
};

const HOMONYMS_BY_LOCALE: Record<
  string,
  Record<string, Record<string, string>>
> = {
  sv: {
    Open: {
      badge: 'Öppen',
      button: 'Öppna',
    },
  },
};

export default defineConfig({
  autoTranslateThreshold: 3,
  include: [
    'src',
  ],
  persistence: 'local-storage',
  preserveTranslationsOnSourceEdit: true,
  processors: [
    react(),
  ],
  translator: Object.assign(
    async (request: TranslateRequest): Promise<string> => {
      await new Promise((resolve) => {
        setTimeout(resolve, TRANSLATE_DELAY_MILLISECONDS);
      });
      if (request.disambiguation) {
        return (
          HOMONYMS_BY_LOCALE[request.targetLocale]?.[request.source]?.[
            request.disambiguation
          ] ?? ''
        );
      }
      return (
        TRANSLATIONS_BY_LOCALE[request.targetLocale]?.[request.source] ?? ''
      );
    },
    {
      id: 'dictionary',
    },
  ),
});
