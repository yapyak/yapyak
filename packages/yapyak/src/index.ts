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

export { type Format, format } from './format';
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
  type RichTextHandler,
  type RichTextHandlers,
  type TFn,
  type TParams,
  type TReturn,
  richText,
  t,
} from './translation';
