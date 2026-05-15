import { getDefaultLocale, getLocale } from '../locale/index.ts';
import { hasPlaceholder, interpolate, runTrackers } from '../runtime/index.ts';

export type Variants = Record<string, string>;

/**
 * @internal
 *
 * Compile-target only. Used by the yapyak Vite plugin's transformed output.
 * Do not import directly — use `t()` from `'yapyak'` instead.
 */
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
