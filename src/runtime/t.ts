import { getLocaleStore } from '../locale/store.js';
import { hasPlaceholder, interpolate } from './interpolate.js';
import { pick } from './pick.js';

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
          ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: Date | number }>
          : Source extends `${string}{${infer Name}, time${string}}${infer Rest}`
            ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: Date | number }>
            : Source extends `${string}{${infer Name},${string}}${infer Rest}`
              ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: unknown }>
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
  : // biome-ignore lint/complexity/noBannedTypes: intentional
    {};

export interface T {
  <Source extends string>(
    source: Source,
    ...args: IsEmpty<Params<Source>> extends true
      ? []
      : [params: Params<Source>]
  ): string;
  in(locale: string): TInLocale;
}

export type TInLocale = <Source extends string>(
  source: Source,
  ...args: IsEmpty<Params<Source>> extends true ? [] : [params: Params<Source>]
) => string;

function call(source: string, params?: Record<string, unknown>): string {
  if (params === undefined || !hasPlaceholder(source)) {
    return source;
  }
  return interpolate(source, params, getLocaleStore().get());
}

function inLocale(locale: string): TInLocale {
  const fn = (source: string, params?: Record<string, unknown>) =>
    pick({ [locale]: source }, params, locale);
  return fn as TInLocale;
}

const fn = call as unknown as T;
fn.in = inLocale;

export const t: T = fn;
