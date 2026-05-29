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

export type {
  CookiePersistence,
  FilterPattern,
  LocalStoragePersistence,
  Persistence,
  UrlPersistence,
  YapyakConfig,
} from '@yapyak/shared';

export { defineConfig } from './config';
export { type Format, format } from './format';
export { defaultLocale, getLocale, locales, setLocale } from './locale';
export { type TFn, type TParams, type TReturn, t } from './translation';
