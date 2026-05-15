import {
  getCachedLocaleData,
  getDefaultLocale,
  getLocale,
} from '../locale/index.ts';
import { hasPlaceholder, interpolate, runTrackers } from '../runtime/index.ts';

/**
 * @internal
 *
 * Compile-target only. Used by the yapyak Vite plugin's transformed output.
 * Do not import directly — use `t()` from `'yapyak'` instead.
 */
export function pick(
  fileId: string,
  source: string,
  params?: Record<string, unknown>,
  fixedLocale?: string,
): string {
  if (fixedLocale === undefined) {
    runTrackers();
  }
  const locale = fixedLocale ?? getLocale();
  let value = source;
  if (locale !== getDefaultLocale()) {
    value = getCachedLocaleData(locale)[fileId]?.[source] ?? source;
  }
  if (params === undefined || !hasPlaceholder(value)) {
    return value;
  }
  return interpolate(value, params, locale);
}
