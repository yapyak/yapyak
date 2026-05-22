/**
 * Runtime translation API. Provides {@link t}, locale getters and setters, and locale subscription.
 *
 * @packageDocumentation
 */

export type { TParams, T, TIn } from './runtime';

export {
  defaultLocale,
  getLocale,
  locales,
  setLocale,
  subscribeLocale,
} from './locale';
export { t } from './runtime';
