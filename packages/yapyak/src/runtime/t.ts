import { pick } from '../internal/index.ts';
import { getLocale } from '../locale/index.ts';
import { hasPlaceholder, interpolate } from './interpolate.ts';
import { runTrackers } from './tracker.ts';

type Trim<Source extends string> = Source extends ` ${infer Rest}`
  ? Trim<Rest>
  : Source extends `${infer Rest} `
    ? Trim<Rest>
    : Source;

type SimpleParam<Placeholder extends string> =
  Trim<Placeholder> extends ''
    ? Record<string, never>
    : { [Key in Trim<Placeholder>]: string | number };

type ResolveIcuPattern<
  Source extends string,
  Accumulated,
> = Source extends `${string}{${infer Name}, plural,${string}}}${infer Rest}`
  ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: number }>
  : Source extends `${string}{${infer Name}, selectordinal,${string}}}${infer Rest}`
    ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: number }>
    : Source extends `${string}{${infer Name}, select,${string}}}${infer Rest}`
      ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: string }>
      : Source extends `${string}{${infer Name}, number${string}}${infer Rest}`
        ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: number }>
        : Source extends `${string}{${infer Name}, date${string}}${infer Rest}`
          ? ExtractParams<
              Rest,
              Accumulated & { [Key in Trim<Name>]: Date | number }
            >
          : Source extends `${string}{${infer Name}, time${string}}${infer Rest}`
            ? ExtractParams<
                Rest,
                Accumulated & { [Key in Trim<Name>]: Date | number }
              >
            : Source extends `${string}{${infer Name},${string}}${infer Rest}`
              ? ExtractParams<
                  Rest,
                  Accumulated & { [Key in Trim<Name>]: unknown }
                >
              : Accumulated extends unknown
                ? { [Key in keyof Accumulated]: Accumulated[Key] }
                : Accumulated;

export type ExtractParams<
  Source extends string,
  Accumulated = unknown,
> = Source extends `${string}{${infer Placeholder}}${infer Rest}`
  ? Placeholder extends `${string},${string}`
    ? ResolveIcuPattern<Source, Accumulated>
    : ExtractParams<Rest, Accumulated & SimpleParam<Placeholder>>
  : Accumulated extends unknown
    ? { [Key in keyof Accumulated]: Accumulated[Key] }
    : Accumulated;

type IsEmpty<T> = keyof T extends never ? true : false;

type Params<Source extends string> = Source extends `${string}{${string}`
  ? ExtractParams<Source>
  : {};

/** The runtime translation function. */
export interface T {
  /** Returns a one-off `t` locked to a specific locale, resolved at call time. */
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

function call(source: string, params?: Record<string, unknown>): string {
  runTrackers();
  if (params === undefined || !hasPlaceholder(source)) {
    return source;
  }
  return interpolate(source, params, getLocale());
}

function inLocale(locale: string): TIn {
  const fn = (source: string, params?: Record<string, unknown>) =>
    pick({ [locale]: source }, params, locale);
  return fn as TIn;
}

const fn = call as unknown as T;
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
