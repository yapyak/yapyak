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
  type Currency,
  type Format,
  type FormatDateTimeOptions,
  type FormatListOptions,
  type FormatNumberOptions,
  type FormatRelativeTimeOptions,
  format,
  isCurrency,
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
