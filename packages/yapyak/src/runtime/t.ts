import type { ExtractParams } from './extract-params';

import { getLocale } from '../locale';
import { hasPlaceholder, interpolate } from './interpolate';
import { runTrackers } from './tracker';

type IsEmpty<T> = keyof T extends never ? true : false;

type Params<Source extends string> = Source extends `${string}{${string}`
  ? ExtractParams<Source>
  : {};

/** The runtime translation function. */
export interface T {
  in(locale: string): TIn;
  <Source extends string>(
    source: Source,
    ...args: IsEmpty<Params<Source>> extends true
      ? []
      : [params: Params<Source>]
  ): string;
}

/** A `t` function locked to a specific locale. */
export type TIn = <Source extends string>(
  source: Source,
  ...args: IsEmpty<Params<Source>> extends true ? [] : [params: Params<Source>]
) => string;

function inLocale(locale: string): TIn {
  const fn: TIn = (source, ...args) => {
    const params = args[0];
    if (params === undefined || !hasPlaceholder(source)) {
      return source;
    }
    return interpolate(source, params as Record<string, unknown>, locale);
  };
  return fn;
}

const fn: T = (source, ...args) => {
  runTrackers();
  const params = args[0];
  if (params === undefined || !hasPlaceholder(source)) {
    return source;
  }
  return interpolate(source, params as Record<string, unknown>, getLocale());
};
fn.in = inLocale;

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
export const t: T = fn;
