import type { Locale } from '../locale';
import type { ValidateSource } from './source';
import type { ExtractTParams } from './t-param';
import type { ExtractPairTags, ExtractVoidTags } from './tag';

/**
 * The params for a source string's placeholders.
 *
 * @remarks
 * Resolves to `never` when the source has no placeholders.
 *
 * @shape TParams<T extends string> = \{ [placeholder]: string | number \}
 *
 * @typeParam T - The source string literal.
 */
export type TParams<T extends string> = T extends `${string}{${string}`
  ? ExtractTParams<T>
  : never;

type TArgs<T extends string> =
  TParams<T> extends never
    ? []
    : unknown extends TParams<T>
      ? []
      : [
          params: TParams<T>,
        ];

declare const brand: unique symbol;

/**
 * Returned by {@link t}.
 *
 * @shape string
 *
 * @typeParam TPair - The pair-tag names extracted from the source string.
 * @typeParam TVoid - The void-tag names extracted from the source string.
 */
export type TReturn<
  TPair extends string = never,
  TVoid extends string = never,
> = [
  TPair | TVoid,
] extends [
  never,
]
  ? string
  : string & {
      [brand]: {
        pair: TPair;
        void: TVoid;
      };
    };

export type TInChain = {
  as<TContext extends string, TSource extends string>(
    context: TContext,
    source: ValidateSource<TSource>,
    ...params: TArgs<TSource>
  ): TReturn<ExtractPairTags<TSource>, ExtractVoidTags<TSource>>;
};

export type TAsChain = {
  in<T extends string>(
    locale: Locale,
    source: ValidateSource<T>,
    ...params: TArgs<T>
  ): TReturn<ExtractPairTags<T>, ExtractVoidTags<T>>;
};

/**
 * Translates a source string for the active locale.
 */
export type TFn = {
  /**
   * Disambiguates a source string by context, or returns a chain that requires `.in()` to complete.
   *
   * @shape t.as<T extends string>(context: string, source: T, params?: TParams<T>): string
   *
   * @typeParam TContext - The disambiguating context literal.
   * @typeParam TSource - The source string literal.
   *
   * @param context - {@shape string} The disambiguating context.
   * @param source - {@shape T} The source string literal.
   * @param params - {@shape TParams<T>} The placeholder values.
   */
  as<TContext extends string, TSource extends string>(
    context: TContext,
    source: ValidateSource<TSource>,
    ...params: TArgs<TSource>
  ): TReturn<ExtractPairTags<TSource>, ExtractVoidTags<TSource>>;
  as<T extends string>(context: T): TAsChain;

  /**
   * Forces a fixed locale for one translation call, or returns a chain that requires `.as()` to complete.
   *
   * @shape t.in<T extends string>(locale: Locale, source: T, params?: TParams<T>): string
   *
   * @typeParam T - The source string literal.
   *
   * @param locale - {@shape Locale} The locale code.
   * @param source - {@shape T} The source string literal.
   * @param params - {@shape TParams<T>} The placeholder values.
   */
  in<T extends string>(
    locale: Locale,
    source: ValidateSource<T>,
    ...params: TArgs<T>
  ): TReturn<ExtractPairTags<T>, ExtractVoidTags<T>>;
  in(locale: Locale): TInChain;
  /**
   * Translates `source` for the active locale.
   *
   * @typeParam T - The source string literal.
   *
   * @param source - {@shape T} The source string literal.
   * @param params - {@shape TParams<T>} The placeholder values.
   */
  <T extends string>(
    source: ValidateSource<T>,
    ...params: TArgs<T>
  ): TReturn<ExtractPairTags<T>, ExtractVoidTags<T>>;
};

/**
 * Translates a source string for the active locale.
 *
 * @shape t<T extends string>(source: T, params?: TParams<T>): string
 *
 * @example
 * ```ts
 * import { t } from 'yapyak';
 *
 * t('Save changes');
 * // output:
 * // en-US: 'Save changes'
 * // sv-SE: 'Spara ändringar'
 *
 * t('Hello, {name}!', { name: 'Alex' });
 * // output: en-US: 'Hello, Alex!'
 *
 * t('You have {count, plural, one {# item} other {# items}}', { count: 1 });
 * // output: en-US: 'You have 1 item'
 * ```
 *
 * @example Forced locale
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.in('sv', 'Welcome back, {name}!', { name: 'Alex' });
 * // output: 'Välkommen tillbaka, Alex!'
 * ```
 *
 * @example Disambiguation
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.as('action', 'Open'); // output: sv-SE: 'Öppna'
 * t.as('status', 'Open'); // output: sv-SE: 'Öppen'
 * ```
 *
 * @example Forced locale with disambiguation
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.in('sv').as('action', 'Open');
 * // output: 'Öppna'
 * ```
 */
export const t: TFn = Object.assign(() => throwNotCompiled('t'), {
  as: () => throwNotCompiled('t.as'),
  in: () => throwNotCompiled('t.in'),
}) as TFn;

function throwNotCompiled(method: 't' | 't.as' | 't.in'): never {
  throw new Error(
    `[yapyak] ${method}() was not rewritten at build time. ` +
      'Install and register a yapyak build-tool plugin (e.g. @yapyak/vite) in your bundler config. ' +
      "If the plugin is registered, check that the file is covered by the config's include patterns (default: src).",
  );
}
