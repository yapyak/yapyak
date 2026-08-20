import type { NormalizedPersistenceConfig } from '../persistence';

export type DefineRuntimeInput = {
  defaultLocale: string;
  detectUserLocale: boolean;
  locales: string[];
  persistence: NormalizedPersistenceConfig;
  syncHtmlAttributes: boolean;
};

export function defineRuntime(input: DefineRuntimeInput): string {
  return [
    `export const LOCALES = ${JSON.stringify(input.locales)};`,
    `export const DEFAULT_LOCALE = ${JSON.stringify(input.defaultLocale)};`,
    `export const PERSISTENCE_CONFIG = ${emitPersistenceConfig(input.persistence)};`,
    `export const DETECT_USER_LOCALE = ${JSON.stringify(input.detectUserLocale)};`,
    `export const SYNC_HTML_ATTRIBUTES = ${JSON.stringify(input.syncHtmlAttributes)};`,
  ].join('\n');
}

function emitPersistenceConfig(config: NormalizedPersistenceConfig): string {
  if (config.type === 'none') {
    return `{ type: 'none' }`;
  }
  if (config.type === 'cookie') {
    return `{ type: 'cookie', name: ${JSON.stringify(config.name)}, secure: ${JSON.stringify(config.secure)} }`;
  }
  if (config.type === 'local-storage') {
    return `{ type: 'local-storage', key: ${JSON.stringify(config.key)} }`;
  }
  if (!config.match) {
    return `{ type: 'url' }`;
  }
  return `{ type: 'url', match: new RegExp(${JSON.stringify(config.match.source)}, ${JSON.stringify(config.match.flags)}) }`;
}
