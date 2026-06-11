import type { Locale } from '../locale';
import type { ValidateSource } from './source';
import type { ExtractTParams } from './t-param';
import type { ExtractPairTags, ExtractVoidTags } from './tag';

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

type TArgs<T extends string> =
  TParams<T> extends never
    ? []
    : [
        params: TParams<T>,
      ];

type ValidContext<T extends string> = string extends T
  ? T
  : T extends `${string}@${string}`
    ? {
        $yapyakTypeError: `Invalid context "${T}": '@' is reserved as the source/context separator`;
      }
    : T;

declare const brand: unique symbol;

/**
 * The return type of {@link t}.
 *
 * @remarks
 * A `string` branded with the rich-text tag names found in the source — pair tags (with content) in `TPair` and void tags (self-closing) in `TVoid` — so a `<RichText>` can require a handler per tag with the right signature. A source with no tags returns a plain `string`.
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

/**
 * The inline chain returned by `t.in(locale)`. Completes via `.as(context, source)`.
 *
 * @remarks
 * Has no callable signature, so it cannot be captured and used as a translator.
 *
 * @example Forced locale with disambiguation
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.in('sv').as('action', 'Open');
 * ```
 */
export type TInChain = {
  as<TContext extends string, TSource extends string>(
    context: ValidContext<TContext>,
    source: ValidateSource<TSource>,
    ...args: TArgs<TSource>
  ): TReturn<ExtractPairTags<TSource>, ExtractVoidTags<TSource>>;
};

/**
 * The inline chain returned by `t.as(context)`. Completes via `.in(locale, source)`.
 *
 * @remarks
 * Has no callable signature, so it cannot be captured and used as a translator.
 *
 * @example Disambiguation with forced locale
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.as('action').in('sv', 'Open');
 * ```
 */
export type TAsChain = {
  in<T extends string>(
    locale: Locale,
    source: ValidateSource<T>,
    ...args: TArgs<T>
  ): TReturn<ExtractPairTags<T>, ExtractVoidTags<T>>;
};

/**
 * Translates a source string for the active locale.
 *
 * @remarks
 * The type of {@link t}. Modifiers `in` and `as` are inline: they accept the source directly, or return a constrained chain that requires the other modifier to complete the call. They do not return translators and cannot be captured.
 */
export type TFn = {
  /**
   * Disambiguates a source string by context, or returns a chain that requires `.in()` to complete.
   *
   * @remarks
   * The compiler emits `YPK403` if a source is used with both `t()` and `t.as()` in the same file.
   *
   * @param context - The disambiguating context. Must not contain `'@'` (reserved as the source/context separator).
   * @param source - The source string literal, supplied to translate inline.
   * @param args - The placeholder params tuple. Required when the source has placeholders.
   */
  as<TContext extends string, TSource extends string>(
    context: ValidContext<TContext>,
    source: ValidateSource<TSource>,
    ...args: TArgs<TSource>
  ): TReturn<ExtractPairTags<TSource>, ExtractVoidTags<TSource>>;
  as<T extends string>(context: ValidContext<T>): TAsChain;

  /**
   * Forces a fixed locale for one translation call, or returns a chain that requires `.as()` to complete.
   *
   * @param locale - The locale code, e.g. `'sv'`.
   * @param source - The source string literal, supplied to translate inline.
   * @param args - The placeholder params tuple. Required when the source has placeholders.
   */
  in<T extends string>(
    locale: Locale,
    source: ValidateSource<T>,
    ...args: TArgs<T>
  ): TReturn<ExtractPairTags<T>, ExtractVoidTags<T>>;
  in(locale: Locale): TInChain;
  /**
   * Translates `source` for the active locale.
   *
   * @param source - The source string literal.
   * @param args - The placeholder params tuple. Required when the source has placeholders.
   */
  <T extends string>(
    source: ValidateSource<T>,
    ...args: TArgs<T>
  ): TReturn<ExtractPairTags<T>, ExtractVoidTags<T>>;
};

/**
 * Translates a source string for the active locale.
 *
 * @remarks
 * Yapyak's compiler rewrites every `t()` call site at build to inline the active-locale's catalog lookup. The source argument must be a string literal — wrapping breaks extraction. Placeholders use `{name}` and their values are type-checked from the source literal. A fixed locale is pinned via `t.in(locale, source)`, and modifiers chain inline: `t.in('sv').as('action', 'Save')`.
 *
 * Every `t.*` call is a compile-time construct — the runtime form throws if it was not rewritten by the build-tool plugin. Yapyak requires the plugin to be registered; the runtime is not a fallback translator.
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
 * t.as('action', 'Open');
 * t.as('status', 'Open');
 * ```
 *
 * @example Combining forced locale and disambiguation
 * ```ts
 * import { t } from 'yapyak';
 *
 * t.in('sv').as('action', 'Open');
 * ```
 */
export const t = Object.assign(() => throwNotCompiled('t'), {
  as: () => throwNotCompiled('t.as'),
  in: () => throwNotCompiled('t.in'),
}) as TFn;

function throwNotCompiled(method: 't' | 't.as' | 't.in'): never {
  throw new Error(
    `[yapyak] ${method}() was not rewritten at build time. ` +
      'Install and register a yapyak build-tool plugin (e.g. @yapyak/vite) in your bundler config.',
  );
}
