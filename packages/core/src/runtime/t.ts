import type { ExtractTParams } from './extract-params';

import { getLocale } from '../locale';
import { hasPlaceholder, interpolate } from './interpolate';
import { runTrackers } from './tracker';

/** @internal */
export type TParams<T extends string> = T extends `${string}{${string}`
  ? ExtractTParams<T>
  : never;

export interface TOptions {
  context?: string;
  locale?: string;
}

/**
 * Translates a source string to the current locale.
 *
 * The leading `$` signals that `$t()` is a compiler macro: yapyak's Vite plugin rewrites every call site at build time. The runtime function exported here is only the fallback for code paths the plugin didn't touch.
 *
 * @remarks
 * Always call `$t()` directly with a string literal at the call site. Yapyak's Vite plugin reads the literal statically to extract translations into locale files — wrapper functions around `$t()` break extraction and are not supported.
 *
 * Placeholders use `{name}` and are type-checked from the source literal. Re-exporting `$t()` under a different name is fine (the literal still appears at the call site); wrapping `$t()` inside another function is not.
 *
 * The optional final argument is an options object: `locale` overrides the ambient locale, and `context` is a translator hint that the extraction plugin can forward to the AI translator.
 *
 * @example
 * ```tsx
 * import { $t } from '@yapyak/core';
 *
 * $t('Save changes');
 *
 * $t('Hello, {name}!', { name: 'Alex' });
 *
 * $t('You have {count, plural, one {# item} other {# items}}', { count: 1 });
 *
 * // Locale override
 * $t('Welcome back, {name}!', { name: user.name }, { locale: user.locale });
 *
 * // Translator context hint, no placeholders
 * $t('Save', { context: 'submit button' });
 * ```
 */
export function $t<T extends string>(
  source: T,
  ...rest: T extends `${string}{${string}`
    ? [params: TParams<T>, options?: TOptions]
    : [options?: TOptions]
): string;
export function $t(source: string, ...rest: unknown[]): string {
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
  if (params === undefined) {
    return source;
  }
  return interpolate(source, params, locale);
}
