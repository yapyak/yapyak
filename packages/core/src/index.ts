/**
 * Runtime entry point for yapyak. Exports the `$t` macro fallback and the locale store.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/core
 * # or
 * pnpm add @yapyak/core
 * ```
 *
 * @packageDocumentation
 */

export { defaultLocale, getLocale, locales, setLocale } from './locale';
export { $t } from './translation';
