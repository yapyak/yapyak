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
