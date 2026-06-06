import type { NormalizedPersistenceConfig } from '../../persistence';

export interface DefineRuntimeInput {
  defaultLocale: string;
  detectAcceptLanguage: boolean;
  locales: string[];
  persistence: NormalizedPersistenceConfig;
  syncHtmlLang: boolean;
}

export function defineRuntime(input: DefineRuntimeInput): string {
  return [
    `export const LOCALES = ${JSON.stringify(input.locales)};`,
    `export const DEFAULT_LOCALE = ${JSON.stringify(input.defaultLocale)};`,
    `export const PERSISTENCE_CONFIG = ${emitPersistenceConfig(input.persistence)};`,
    `export const DETECT_ACCEPT_LANGUAGE = ${JSON.stringify(input.detectAcceptLanguage)};`,
    `export const SYNC_HTML_LANG = ${JSON.stringify(input.syncHtmlLang)};`,
  ].join('\n');
}

function emitPersistenceConfig(config: NormalizedPersistenceConfig): string {
  if (config === null) {
    return 'null';
  }
  if (config.type === 'cookie') {
    return `{ type: 'cookie', name: ${JSON.stringify(config.name)} }`;
  }
  if (config.type === 'local-storage') {
    return `{ type: 'local-storage', key: ${JSON.stringify(config.key)} }`;
  }
  if (!config.match) {
    return `{ type: 'url' }`;
  }
  return `{ type: 'url', match: new RegExp(${JSON.stringify(config.match.source)}, ${JSON.stringify(config.match.flags)}) }`;
}
