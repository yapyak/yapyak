import { i18n } from '../i18n';
import { hasPlaceholder, interpolate, runTrackers } from '../runtime';

type Variants = Record<string, string>;

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
  const locale = fixedLocale ?? i18n.locale;
  const value = variants[locale] ?? variants[i18n.defaultLocale] ?? '';
  if (params === undefined || !hasPlaceholder(value)) {
    return value;
  }
  return interpolate(value, params, locale);
}
