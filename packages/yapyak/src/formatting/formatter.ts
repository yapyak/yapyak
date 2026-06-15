import { defaultLocale } from '../locale';
import { warn } from '../warn';
import { isCurrency } from './currency';

type IntlFormatterCtor<T> = new (locale: string, options?: object) => T;

const MAX_FORMATTERS_PER_CTOR = 64;

const caches = new Map<IntlFormatterCtor<unknown>, Map<string, unknown>>();
const warnedCurrencyKeys = new Set<string>();
const warnedInvalidLocales = new Set<string>();
const validLocaleCache = new Map<string, string>();

export function resolveFormatter<T>(
  ctor: IntlFormatterCtor<T>,
  locale: string,
  options: object | undefined,
): T {
  const safeLocale = resolveValidLocale(locale);
  let cache = caches.get(ctor) as Map<string, T> | undefined;
  if (!cache) {
    cache = new Map();
    caches.set(ctor, cache as Map<string, unknown>);
  }
  const key = buildCanonicalKey(safeLocale, options);
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const formatter = buildFormatter(ctor, safeLocale, options);
  if (cache.size >= MAX_FORMATTERS_PER_CTOR) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, formatter);
  return formatter;
}

function buildFormatter<T>(
  ctor: IntlFormatterCtor<T>,
  locale: string,
  options: object | undefined,
): T {
  if (isCurrencyConstruction(ctor, options)) {
    const code = (options as Intl.NumberFormatOptions).currency as string;
    if (!isCurrency(code)) {
      warnUnsupportedCurrencyOnce(code, locale, null);
      return buildCurrencyFallback(locale, code, options) as T;
    }
  }
  try {
    return new ctor(locale, options);
  } catch (cause) {
    if (isCurrencyConstruction(ctor, options)) {
      const code = (options as Intl.NumberFormatOptions).currency as string;
      warnUnsupportedCurrencyOnce(code, locale, cause);
      return buildCurrencyFallback(locale, code, options) as T;
    }
    throw cause;
  }
}

function buildCanonicalKey(
  locale: string,
  options: object | undefined,
): string {
  if (!options) {
    return locale;
  }
  const optionEntries = Object.entries(options).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const parts = [
    locale,
  ];
  for (const [key, value] of optionEntries) {
    parts.push(`${key}=${JSON.stringify(value)}`);
  }
  return parts.join('|');
}

function isCurrencyConstruction(
  ctor: IntlFormatterCtor<unknown>,
  options: object | undefined,
): boolean {
  if (ctor !== (Intl.NumberFormat as unknown as IntlFormatterCtor<unknown>)) {
    return false;
  }
  const numberOptions = options as Intl.NumberFormatOptions | undefined;
  return (
    numberOptions?.style === 'currency' &&
    typeof numberOptions.currency === 'string'
  );
}

function warnUnsupportedCurrencyOnce(
  code: string,
  locale: string,
  cause: unknown,
): void {
  const dedupKey = `${locale}|${code}`;
  if (warnedCurrencyKeys.has(dedupKey)) {
    return;
  }
  warnedCurrencyKeys.add(dedupKey);
  const meta: Record<string, unknown> = {
    currency: code,
    locale,
  };
  if (cause !== null) {
    meta.cause = cause;
  }
  warn(
    `Unsupported currency code "${code}" — rendered as "<value> ${code}".`,
    meta,
  );
}

function buildCurrencyFallback(
  locale: string,
  code: string,
  options: object | undefined,
): Intl.NumberFormat {
  const numberOnly = new Intl.NumberFormat(
    locale,
    stripCurrencyFields(options),
  );
  return {
    format: (value: number) => `${numberOnly.format(value)} ${code}`,
  } as Intl.NumberFormat;
}

function stripCurrencyFields(
  options: object | undefined,
): Intl.NumberFormatOptions {
  if (!options) {
    return {};
  }
  const {
    style: _style,
    currency: _currency,
    currencyDisplay: _currencyDisplay,
    currencySign: _currencySign,
    ...rest
  } = options as Intl.NumberFormatOptions;
  return rest;
}

function resolveValidLocale(locale: string): string {
  const cached = validLocaleCache.get(locale);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const canonical = new Intl.Locale(locale).toString();
    validLocaleCache.set(locale, canonical);
    return canonical;
  } catch {
    if (!warnedInvalidLocales.has(locale)) {
      warnedInvalidLocales.add(locale);
      warn(
        `Invalid locale "${locale}" — falling back to default "${defaultLocale}".`,
        {
          code: 'YPK_INVALID_FORCED_LOCALE',
          requested: locale,
        },
      );
    }
    validLocaleCache.set(locale, defaultLocale);
    return defaultLocale;
  }
}
