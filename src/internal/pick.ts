import { getDefaultLocale, getLocale } from '../locale/store.js';
import { hasPlaceholder, interpolate } from '../runtime/interpolate.js';
import { runTrackers } from '../runtime/tracker.js';

export type Variants = Record<string, string>;

export function pick(
  variants: Variants,
  params?: Record<string, unknown>,
  fixedLocale?: string,
): string {
  if (fixedLocale === undefined) {
    runTrackers();
  }
  const locale = fixedLocale ?? getLocale();
  const value = variants[locale] ?? variants[getDefaultLocale()] ?? '';
  if (params === undefined || !hasPlaceholder(value)) {
    return value;
  }
  return interpolate(value, params, locale);
}
