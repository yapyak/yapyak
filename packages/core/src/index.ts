/**
 * Runtime entry point for yapyak. Exports the `$t` macro fallback, the locale store, and the compiler-target `_$pick` helper — everything a yapyak app or framework adapter needs at runtime.
 *
 * Advanced consumers reach for separate packages: `@yapyak/adapter` (server SSR primitives), `@yapyak/translator` (custom translator toolkit), `@yapyak/compiler` (build-time extraction).
 *
 * @packageDocumentation
 */

export type { NormalizedPersistence } from './persistence';

export { _$pick } from './internal';
export {
  defaultLocale,
  getLocale,
  locales,
  resetLocale,
  setLocale,
  setRequestReader,
  subscribeLocale,
} from './locale';
export { $t, registerTracker, runTrackers, type TParams } from './runtime';
