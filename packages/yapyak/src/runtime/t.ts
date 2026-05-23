import type { ExtractTParams } from './extract-params';

import { getLocale } from '../locale';
import { hasPlaceholder, interpolate } from './interpolate';
import { runTrackers } from './tracker';

/** @internal */
export type TParams<T extends string> = T extends `${string}{${string}`
  ? ExtractTParams<T>
  : {};

/** @internal */
export interface TIn {
  <T extends string>(source: T): string;
  <T extends string>(source: T, params: TParams<T>): string;
}

/** @internal */
export interface T extends TIn {
  in(locale: string): TIn;
}

function translate(source: string, params: unknown, locale: string): string {
  if (params === undefined || !hasPlaceholder(source)) {
    return source;
  }
  return interpolate(source, params as Record<string, unknown>, locale);
}

function tIn(locale: string): TIn {
  function scoped<T extends string>(source: T): string;
  function scoped<T extends string>(source: T, params: TParams<T>): string;
  function scoped(source: string, params?: unknown): string {
    return translate(source, params, locale);
  }
  return scoped;
}

/**
 * Translates a source string to the current locale.
 *
 * @remarks
 * Always call `t` directly with a string literal at the call site. Yapyak's Vite plugin reads the literal statically to extract translations into locale files — wrapper functions around `t` break extraction and are not supported.
 *
 * Placeholders use `{name}` and are type-checked from the source literal. Re-exporting `t` under a different name is fine (the literal still appears at the call site); wrapping `t` inside another function is not.
 *
 * @example
 * ```tsx
 * import { t } from 'yapyak';
 *
 * t('Save changes');
 *
 * t('Hello, {name}!', { name: 'Alex' });
 *
 * t('You have {count, plural, one {# item} other {# items}}', { count: 1 });
 *
 * t.in(user.locale)('Welcome back, {name}!', { name: user.name });
 * ```
 */
export const t: T = Object.assign(
  ((source: string, params?: unknown): string => {
    runTrackers();
    return translate(source, params, getLocale());
  }) as TIn,
  { in: tIn },
);
