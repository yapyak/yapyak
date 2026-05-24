/**
 * Runtime entry point for yapyak. Exports the `$t` macro fallback, the locale store, persistence types, and the compiler-target `_$pick` helper — everything a yapyak app needs at runtime.
 *
 * Advanced consumers reach for separate packages: `@yapyak/adapter` (server SSR primitives), `@yapyak/translator` (custom translator toolkit), `@yapyak/compiler` (build-time extraction).
 *
 * @packageDocumentation
 */

export { _$pick } from './internal';
export {
  defaultLocale,
  getLocale,
  locales,
  parseAcceptLanguage,
  type RequestHeaders,
  registerRequestHeadersReader,
  resetLocale,
  resolveLocale,
  setLocale,
  subscribeLocale,
} from './locale';
export {
  createPersistence,
  type NormalizedPersistence,
  type Persistence,
  parseCookie,
} from './persistence';
export {
  $t,
  hasPlaceholder,
  interpolate,
  registerTracker,
  runTrackers,
  type TParams,
} from './runtime';
