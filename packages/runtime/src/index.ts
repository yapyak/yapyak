/**
 * Runtime for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/runtime
 * # or
 * pnpm add @yapyak/runtime
 * ```
 *
 * @packageDocumentation
 */

export type PersistenceConfig =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;

export const LOCALES: string[] = [];
export const DEFAULT_LOCALE = 'en';
export const PERSISTENCE: PersistenceConfig = null;
export const DETECT_ACCEPT_LANGUAGE = false;
export const SYNC_HTML_LANG = false;
