import type { NormalizedPersistence } from './persistence';

import { emitPersistence } from './persistence';

export interface DefineRuntimeInput {
  defaultLocale: string;
  detectAcceptLanguage: boolean;
  locales: readonly string[];
  persistence: NormalizedPersistence;
  syncHtmlLang: boolean;
}

export function defineRuntime(input: DefineRuntimeInput): string {
  return [
    `export const LOCALES = ${JSON.stringify(input.locales)};`,
    `export const DEFAULT_LOCALE = ${JSON.stringify(input.defaultLocale)};`,
    `export const PERSISTENCE = ${emitPersistence(input.persistence)};`,
    `export const DETECT_ACCEPT_LANGUAGE = ${JSON.stringify(input.detectAcceptLanguage)};`,
    `export const SYNC_HTML_LANG = ${JSON.stringify(input.syncHtmlLang)};`,
  ].join('\n');
}
