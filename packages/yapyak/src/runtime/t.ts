import type { ExtractParamDict } from './extract-params';

import { getLocale } from '../locale';
import { hasPlaceholder, interpolate } from './interpolate';
import { runTrackers } from './tracker';

/**
 * The placeholder values for a source string. Empty if the source has no
 * placeholders, otherwise a record of placeholder name to expected value type.
 */
export type ParamDict<T extends string> = T extends `${string}{${string}`
  ? ExtractParamDict<T>
  : {};

/** A `t` function locked to a specific locale. */
export interface TIn {
  <T extends string>(source: T): string;
  <T extends string>(source: T, params: ParamDict<T>): string;
}

/** The runtime translation function. */
export interface T extends TIn {
  in(locale: string): TIn;
}

function makeT(readLocale: () => string, track: boolean): TIn {
  const translate = (source: string, params?: unknown): string => {
    if (track) {
      runTrackers();
    }
    if (params === undefined || !hasPlaceholder(source)) {
      return source;
    }
    return interpolate(source, params as Record<string, unknown>, readLocale());
  };
  return translate as TIn;
}

/**
 * Translates a source string to the current locale.
 *
 * The first argument must be a static string literal — yapyak's Vite plugin
 * reads it statically to extract translations. Placeholders use `{name}` and
 * are type-checked from the source literal.
 *
 * @example
 * ```tsx
 * t('Save changes');
 *
 * t('Hello, {name}!', { name: 'Alex' });
 *
 * t('You have {count, plural, one {# item} other {# items}}', { count: 1 });
 *
 * t.in(user.locale)('Welcome back, {name}!', { name: user.name });
 * ```
 */
export const t: T = Object.assign(makeT(getLocale, true), {
  in: (locale: string): TIn => makeT(() => locale, false),
});
