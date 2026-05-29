import type { ExtractTParams } from './t-param';
import type { ExtractTags } from './tag';

import { getLocale } from '../locale';
import { interpolate } from './interpolate';
import { runTrackers } from './tracker';

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
  : string & { [brand]?: T };

/**
 * Translates a source string for the active or a scoped locale.
 *
 * @remarks
 * The type of {@link t}. Also returned by `t.in()`, so a locale-scoped translator carries the same shape.
 */
export interface TFn {
  /**
   * Scopes translation to a fixed locale.
   *
   * @param locale - The locale code, e.g. `'sv'`.
   */
  in(locale: string): TFn;

  /**
   * @param source - The source string literal.
   * @param params - The placeholder params. Required when the source has placeholders.
   */
  <T extends string>(source: T, params?: TParams<T>): TReturn<ExtractTags<T>>;
}

/**
 * Translates a source string for the active locale.
 *
 * @remarks
 * Yapyak's compiler rewrites every `t()` call site at build; the runtime is the fallback for paths the compiler did not touch. Call with a string literal — wrapping breaks extraction. Placeholders use `{name}` and their values are type-checked from the source literal. Scope a fixed locale with `t.in()`.
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
 * const sv = t.in('sv');
 * sv('Welcome back, {name}!', { name: 'Alex' });
 * ```
 */
export const t: TFn = makeTFn();

function makeTFn(boundLocale?: string): TFn {
  const translate = Object.assign(
    <T extends string>(
      source: T,
      params?: TParams<T>,
    ): TReturn<ExtractTags<T>> => {
      runTrackers();
      if (params === undefined) {
        return source as TReturn<ExtractTags<T>>;
      }
      const locale = boundLocale ?? getLocale();
      return interpolate(
        source,
        params as Record<string, unknown>,
        locale,
      ) as TReturn<ExtractTags<T>>;
    },
    {
      in: (locale: string): TFn => makeTFn(locale),
    },
  );
  return translate;
}
