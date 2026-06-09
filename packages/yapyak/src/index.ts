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

export { type SerializedYapyakError, YapyakError } from './error';
export { type Format, format } from './format';
export {
  defaultLocale,
  getLocale,
  isLocale,
  type Locale,
  locales,
  type Register,
  setLocale,
} from './locale';
export {
  type RichTextHandler,
  type RichTextHandlers,
  richText,
  type TFn,
  type TParams,
  type TReturn,
  t,
} from './translation';
