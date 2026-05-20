import type { ExtractParams } from './extract-params';

import { i18n } from '../i18n';
import { hasPlaceholder, interpolate } from './interpolate';
import { runTrackers } from './tracker';

/**
 * The placeholder values for a source string. Empty if the source has no
 * placeholders, otherwise a record of placeholder name to expected value type.
 */
export type Params<Source extends string> = Source extends `${string}{${string}`
  ? ExtractParams<Source>
  : {};

/** The runtime translation function. */
export interface T {
  in(locale: string): TIn;
  <Source extends string>(source: Source): string;
  <Source extends string>(source: Source, params: Params<Source>): string;
}

/** A `t` function locked to a specific locale. */
export interface TIn {
  <Source extends string>(source: Source): string;
  <Source extends string>(source: Source, params: Params<Source>): string;
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
  return interpolate(source, params as Record<string, unknown>, i18n.locale);
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
