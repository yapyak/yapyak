/**
 * Runtime + orchestration entry point for yapyak. Exports the `$t` macro fallback, locale store, adapter primitives, translator orchestration, persistence types, and the compiler-target `_$pick` helper.
 *
 * @packageDocumentation
 */

export { withRequest } from './adapter';
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
export {
  type BuildSystemOptions,
  buildSystem,
  type ContextLevel,
  type CreateTranslatorOptions,
  createTranslator,
  type FetchWithRetryOptions,
  fetchWithRetry,
  type MessageContext,
  stripCodeFence,
  type TranslateBatchRequest,
  type TranslateItem,
  type TranslateRequest,
  type Translator,
} from './translator';
