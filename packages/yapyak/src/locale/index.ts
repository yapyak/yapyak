export type { Locale, Register } from './type';

export { getLocaleFallbackChain } from './fallback-chain';
export {
  autoSubscribeLocale,
  defaultLocale,
  getLocale,
  isLocale,
  locales,
  parseLocale,
  resetLocale,
  setLocale,
  subscribeLocale,
} from './store';
