/**
 * Runtime entry point for yapyak. Exports the `$t` macro fallback, the locale store, the `RequestHeaders` shape for adapter integration, and the compiler-target `_$pick` helper — everything a yapyak app or framework adapter needs at runtime.
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
  type RequestHeaders,
  registerRequestHeadersReader,
  resetLocale,
  setLocale,
  subscribeLocale,
} from './locale';
export { type NormalizedPersistence } from './persistence';
export { $t, registerTracker, runTrackers, type TParams } from './runtime';
