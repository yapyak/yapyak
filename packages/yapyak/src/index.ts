/**
 * Runtime API for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install yapyak
 * # or
 * pnpm add yapyak
 * ```
 *
 * @packageDocumentation
 */

export type {
  Currency,
  Format,
  FormatDateTimeOptions,
  FormatListOptions,
  FormatNumberOptions,
  FormatRelativeTimeOptions,
} from './formatting';
export type { Locale, Register } from './locale';
export type { RichTextNode, TFn, TParams, TReturn } from './translation';

export { format, isCurrency } from './formatting';
export {
  defaultLocale,
  getLocale,
  getLocaleFallbackChain,
  isLocale,
  locales,
  parseLocale,
  setLocale,
} from './locale';
export { parseRichText, t } from './translation';
