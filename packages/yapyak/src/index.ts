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

export {
  type CurrencyCode,
  type CurrencyCodeInput,
  type Format,
  format,
  isCurrencyCode,
  parseCurrencyCode,
} from './formatting';
export {
  type Locale,
  type Register,
  defaultLocale,
  getLocale,
  isLocale,
  locales,
  setLocale,
} from './locale';
export {
  type RichTextNode,
  type TFn,
  type TParams,
  type TReturn,
  parseRichText,
  t,
} from './translation';
