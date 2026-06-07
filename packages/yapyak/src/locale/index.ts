export type { Locale, Register } from './type';

export { parseAcceptLanguage } from './accept-language';
export { setRequestReader } from './request-reader';
export { resolveLocale } from './resolve';
export {
  appendResponseHeader,
  setResponseHeaderWriter,
} from './response-header-writer';
export {
  autoSubscribeLocale,
  defaultLocale,
  getLocale,
  isLocale,
  locales,
  resetLocale,
  setLocale,
  subscribeLocale,
} from './store';
