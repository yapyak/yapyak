import type { ExtractTParams } from './t-param';
import type { ExtractTags } from './tag';

import { getLocale } from '../locale';
import { interpolate } from './interpolate';
import { hasPlaceholder } from './placeholder';
import { runTrackers } from './tracker';

type TParams<T extends string> = T extends `${string}{${string}`
  ? ExtractTParams<T>
  : never;

export interface TOptions {
  locale?: string;
}

declare const brand: unique symbol;

export type TReturn<T extends string = never> = [T] extends [never]
  ? string
  : string & { readonly [brand]?: T };

/**
 * Translates a source string to the current locale.
 *
 * @remarks
 * Yapyak's compiler rewrites every `t()` call site at build. The runtime function is the fallback for paths the compiler didn't touch.
 *
 * Call `t()` with a string literal at the call site — wrapping breaks extraction; re-exporting under a different name is fine. Placeholders use `{name}` and are type-checked from the source literal. An optional final `options` argument takes `locale` (override).
 *
 * @example Translate strings, with and without placeholders
 * ```tsx
 * import { t } from 'yapyak';
 *
 * t('Save changes');
 *
 * t('Hello, {name}!', { name: 'Alex' });
 *
 * t('You have {count, plural, one {# item} other {# items}}', { count: 1 });
 *
 * // Locale override
 * t('Welcome back, {name}!', { name: user.name }, { locale: user.locale });
 * ```
 */
export function t<T extends string>(
  source: T,
  ...rest: T extends `${string}{${string}`
    ? [params: TParams<T>, options?: TOptions]
    : [options?: TOptions]
): TReturn<ExtractTags<T>>;
export function t(source: string, ...rest: unknown[]): string {
  let params: Record<string, unknown> | undefined;
  let options: TOptions | undefined;
  if (hasPlaceholder(source)) {
    params = rest[0] as Record<string, unknown> | undefined;
    options = rest[1] as TOptions | undefined;
  } else {
    options = rest[0] as TOptions | undefined;
  }
  runTrackers();
  const locale = options?.locale ?? getLocale();
  if (!params) {
    return source;
  }
  return interpolate(source, params, locale);
}
