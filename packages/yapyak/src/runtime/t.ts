import type { ExtractParamDict } from './extract-params';

import { getLocale } from '../locale';
import { hasPlaceholder, interpolate } from './interpolate';
import { runTrackers } from './tracker';

/**
 * The placeholder values for a source string. Empty if the source has no
 * placeholders, otherwise a record of placeholder name to expected value type.
 */
export type ParamDict<S extends string> = S extends `${string}{${string}`
  ? ExtractParamDict<S>
  : {};

/** The runtime translation function. */
export interface T {
  in(locale: string): TIn;
  <S extends string>(source: S): string;
  <S extends string>(source: S, params: ParamDict<S>): string;
}

/** A `t` function locked to a specific locale. */
export interface TIn {
  <S extends string>(source: S): string;
  <S extends string>(source: S, params: ParamDict<S>): string;
}

function inLocale(locale: string): TIn {
  const fn = (source: string, params?: unknown): string => {
    if (params === undefined || !hasPlaceholder(source)) {
      return source;
    }
    return interpolate(source, params as Record<string, unknown>, locale);
  };
  return fn as TIn;
}

const fn = (source: string, params?: unknown): string => {
  runTrackers();
  if (params === undefined || !hasPlaceholder(source)) {
    return source;
  }
  return interpolate(source, params as Record<string, unknown>, getLocale());
};
(fn as T).in = inLocale;

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
export const t: T = fn as T;
