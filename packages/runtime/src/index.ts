export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;

export const LOCALES: readonly string[] = Object.freeze([]);
export const DEFAULT_LOCALE = 'en';
export const PERSISTENCE: NormalizedPersistence = null;
export const DETECT_ACCEPT_LANGUAGE = false;
export const SYNC_HTML_LANG = false;

if (process.env.NODE_ENV !== 'production' && LOCALES.length === 0) {
  console.warn(
    '[yapyak] @yapyak/runtime is using placeholder defaults — is the build-tool plugin (@yapyak/vite or equivalent) registered?',
  );
}

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

function emitPersistence(persistence: NormalizedPersistence): string {
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
