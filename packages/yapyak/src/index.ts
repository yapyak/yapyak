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
export {
  type FormatDateOptions,
  type FormatListOptions,
  type FormatNumberOptions,
  type FormatRelativeTimeOptions,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTime,
} from './format';
export { defaultLocale, getLocale, locales, setLocale } from './locale';
export { type TOptions, t } from './translation';
