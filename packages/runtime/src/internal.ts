import type { PersistenceConfig } from './index';

export interface DefineRuntimeInput {
  defaultLocale: string;
  detectAcceptLanguage: boolean;
  locales: string[];
  persistence: PersistenceConfig;
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

function emitPersistence(persistence: PersistenceConfig): string {
  if (persistence === null) {
    return 'null';
  }
  if (persistence.type === 'cookie') {
    return `{ type: 'cookie', name: ${JSON.stringify(persistence.name)} }`;
  }
  if (persistence.type === 'localStorage') {
    return `{ type: 'localStorage', key: ${JSON.stringify(persistence.key)} }`;
  }
  if (persistence.match === undefined) {
    return `{ type: 'url' }`;
  }
  return `{ type: 'url', match: new RegExp(${JSON.stringify(persistence.match.source)}, ${JSON.stringify(persistence.match.flags)}) }`;
}
