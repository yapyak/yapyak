import { getLocaleStore } from '../locale/store.js';
import { hasPlaceholder, interpolate } from './interpolate.js';

export type Variants = Record<string, string>;

export function pick(
  variants: Variants,
  params?: Record<string, unknown>,
  fixedLocale?: string,
): string {
  const store = getLocaleStore();
  const locale = fixedLocale ?? store.get();
  const value = variants[locale] ?? variants[store.defaultLocale] ?? '';
  if (params === undefined || !hasPlaceholder(value)) {
    return value;
  }
  return interpolate(value, params, locale);
}
