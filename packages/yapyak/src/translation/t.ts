import type { Locale } from '../locale';
import type { ExtractTParams } from './t-param';
import type { ExtractTags } from './tag';

import { getLocale } from '../locale';
import { runTrackers } from '../tracker';
import { interpolate } from './interpolate';

/**
 * The params for a source string's placeholders.
 *
 * @remarks
 * Resolves to the placeholder names and value types read from the source literal. `never` if the source has no placeholders.
 *
 * @typeParam T - The source string literal.
 */
export type TParams<T extends string> = T extends `${string}{${string}`
  ? ExtractTParams<T>
  : never;

declare const brand: unique symbol;

/**
 * The return type of {@link t}.
 *
 * @remarks
 * A `string` branded with the rich-text tag names found in the source, so a `<RichText>` can require a handler per tag. A source with no tags returns a plain `string`.
 *
 * @typeParam T - The rich-text tag names extracted from the source string.
 */
export type TReturn<T extends string = never> = [T] extends [never]
  ? string
  : string & { [brand]: T };

/**
 * The inline chain returned by `t.in(locale)`. Completes via `.at(context, source)`.
 *
 * @remarks
 * Has no callable signature, so it cannot be captured and used as a translator.
 *
 * @example Forced locale with disambiguation
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.in('sv').at('action', 'Open');
 * ```
 */
export interface TInChain {
  at<T extends string>(
    context: string,
    source: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>>;
}

/**
 * The inline chain returned by `t.at(context)`. Completes via `.in(locale, source)`.
 *
 * @remarks
 * Has no callable signature, so it cannot be captured and used as a translator.
 *
 * @example Disambiguation with forced locale
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.at('action').in('sv', 'Open');
 * ```
 */
export interface TAtChain {
  in<T extends string>(
    locale: Locale,
    source: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>>;
}

/**
 * Translates a source string for the active locale.
 *
 * @remarks
 * The type of {@link t}. Modifiers `in` and `at` are inline: they accept the source directly, or return a constrained chain that requires the other modifier to complete the call. They do not return translators and cannot be captured.
 */
export interface TFn {
  /**
   * Disambiguates a source string by context, or returns a chain that requires `.in()` to complete.
   *
   * @remarks
   * The compiler emits {@link https://yapyak.dev/diagnostics/YPK403 YPK403} if a source is used with both `t()` and `t.at()` in the same file.
   *
   * @param context - The disambiguating context. Must match `[a-z][a-z0-9-]*`.
   * @param source - The source string literal, supplied to translate inline.
   * @param params - The placeholder params. Required when the source has placeholders.
   */
  at<T extends string>(
    context: string,
    source: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>>;
  at(context: string): TAtChain;

  /**
   * Forces a fixed locale for one translation call, or returns a chain that requires `.at()` to complete.
   *
   * @param locale - The locale code, e.g. `'sv'`.
   * @param source - The source string literal, supplied to translate inline.
   * @param params - The placeholder params. Required when the source has placeholders.
   */
  in<T extends string>(
    locale: Locale,
    source: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>>;
  in(locale: Locale): TInChain;
  /**
   * Translates `source` for the active locale.
   *
   * @param source - The source string literal.
   * @param params - The placeholder params. Required when the source has placeholders.
   */
  <T extends string>(source: T, params?: TParams<T>): TReturn<ExtractTags<T>>;
}

/**
 * Translates a source string for the active locale.
 *
 * @remarks
 * Yapyak's compiler rewrites every `t()` call site at build; the runtime is the fallback for paths the compiler did not touch. The source argument must be a string literal — wrapping breaks extraction. Placeholders use `{name}` and their values are type-checked from the source literal. A fixed locale is pinned via `t.in(locale, source)`, and modifiers chain inline: `t.in('sv').at('action', 'Open')`.
 *
 * @example Translate, with and without placeholders
 * ```ts
 * import { t } from 'yapyak';
 *
 * t('Save changes');
 * t('Hello, {name}!', { name: 'Alex' });
 * t('You have {count, plural, one {# item} other {# items}}', { count: 1 });
 * ```
 *
 * @example Forced locale at the call site
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.in('sv', 'Welcome back, {name}!', { name: 'Alex' });
 * ```
 *
 * @example Disambiguating homonyms
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.at('action', 'Open');
 * t.at('status', 'Open');
 * ```
 *
 * @example Combining forced locale and disambiguation
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.in('sv').at('action', 'Open');
 * ```
 */
export const t: TFn = createTFn();

function createTFn(boundLocale?: string): TFn {
  const translate = <T extends string>(
    source: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>> => {
    runTrackers();
    if (params === undefined) {
      return source as unknown as TReturn<ExtractTags<T>>;
    }
    const locale = boundLocale ?? getLocale();
    return interpolate(
      source,
      params as Record<string, unknown>,
      locale,
    ) as unknown as TReturn<ExtractTags<T>>;
  };

  function inMethod<T extends string>(
    locale: string,
    source: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>>;
  function inMethod(locale: string): TInChain;
  function inMethod<T extends string>(
    locale: string,
    source?: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>> | TInChain {
    if (source === undefined) {
      return {
        at: <TSource extends string>(
          context: string,
          atSource: TSource,
          atParams?: TParams<TSource>,
        ): TReturn<ExtractTags<TSource>> => {
          void context;
          const scoped = createTFn(locale);
          return scoped(atSource, atParams);
        },
      };
    }
    const scoped = createTFn(locale);
    return scoped(source, params);
  }

  function atMethod<T extends string>(
    context: string,
    source: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>>;
  function atMethod(context: string): TAtChain;
  function atMethod<T extends string>(
    context: string,
    source?: T,
    params?: TParams<T>,
  ): TReturn<ExtractTags<T>> | TAtChain {
    void context;
    if (source === undefined) {
      return {
        in: <TSource extends string>(
          locale: string,
          inSource: TSource,
          inParams?: TParams<TSource>,
        ): TReturn<ExtractTags<TSource>> => {
          const scoped = createTFn(locale);
          return scoped(inSource, inParams);
        },
      };
    }
    return translate(source, params);
  }

  return Object.assign(translate, {
    at: atMethod,
    in: inMethod,
  }) as TFn;
}
