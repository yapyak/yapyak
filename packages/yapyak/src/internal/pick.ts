import { defaultLocale, getLocale } from '../locale';
import { hasPlaceholder, interpolate, runTrackers } from '../runtime';

type Variants = Record<string, string>;

/** @internal */
export function pick(
  variants: Variants,
  params?: Record<string, unknown>,
  fixedLocale?: string,
): string {
  if (fixedLocale === undefined) {
    runTrackers();
  }
  const active = fixedLocale ?? getLocale();
  const value = variants[active] ?? variants[defaultLocale] ?? '';
  if (params === undefined || !hasPlaceholder(value)) {
    return value;
  }
  return interpolate(value, params, active);
}
