import { warnDiagnostic } from '../diagnostic';
import { defaultLocale } from '../locale';
import { isCurrency } from './currency';

type IntlFormatterCtor<T> = new (locale: string, options?: object) => T;

const MAX_FORMATTERS_PER_CTOR = 64;
const MAX_VALID_LOCALES = 64;
const MAX_WARNED_INVALID_LOCALES = 64;

const caches = new Map<IntlFormatterCtor<unknown>, Map<string, unknown>>();
const warnedCurrencyKeys = new Set<string>();
const warnedUnitKeys = new Set<string>();
const warnedTimeZoneKeys = new Set<string>();
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
      warnUnsupportedCurrencyOnce(code, locale);
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
    if (isUnitConstruction(ctor, options)) {
      const unit = (options as Intl.NumberFormatOptions).unit as string;
      warnUnsupportedUnitOnce(unit, locale, cause);
      return buildUnitFallback(locale, unit, options) as T;
    }
    if (isTimeZoneConstruction(ctor, options)) {
      const timeZone = (options as Intl.DateTimeFormatOptions)
        .timeZone as string;
      warnUnsupportedTimeZoneOnce(timeZone, locale, cause);
      return buildTimeZoneFallback(ctor, locale, options);
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
  const optionEntries = Object.entries(options).sort(
    ([leftKey], [rightKey]) => {
      if (leftKey < rightKey) {
        return -1;
      }
      if (leftKey > rightKey) {
        return 1;
      }
      return 0;
    },
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
  if ((ctor as typeof Intl.NumberFormat) !== Intl.NumberFormat) {
    return false;
  }
  const numberOptions = options as Intl.NumberFormatOptions | undefined;
  return (
    numberOptions?.style === 'currency' &&
    typeof numberOptions.currency === 'string'
  );
}

function isUnitConstruction(
  ctor: IntlFormatterCtor<unknown>,
  options: object | undefined,
): boolean {
  if ((ctor as typeof Intl.NumberFormat) !== Intl.NumberFormat) {
    return false;
  }
  const numberOptions = options as Intl.NumberFormatOptions | undefined;
  return (
    numberOptions?.style === 'unit' && typeof numberOptions.unit === 'string'
  );
}

function isTimeZoneConstruction(
  ctor: IntlFormatterCtor<unknown>,
  options: object | undefined,
): boolean {
  if ((ctor as typeof Intl.DateTimeFormat) !== Intl.DateTimeFormat) {
    return false;
  }
  const dateOptions = options as Intl.DateTimeFormatOptions | undefined;
  return typeof dateOptions?.timeZone === 'string';
}

function warnUnsupportedCurrencyOnce(
  code: string,
  locale: string,
  cause?: unknown,
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
  if (cause !== undefined) {
    meta.cause = cause;
  }
  warnDiagnostic(
    'FORMAT_UNSUPPORTED_CURRENCY',
    {
      code,
    },
    meta,
  );
}

function warnUnsupportedUnitOnce(
  unit: string,
  locale: string,
  cause: unknown,
): void {
  const dedupKey = `${locale}|${unit}`;
  if (warnedUnitKeys.has(dedupKey)) {
    return;
  }
  warnedUnitKeys.add(dedupKey);
  const meta: Record<string, unknown> = {
    cause,
    locale,
    unit,
  };
  warnDiagnostic(
    'FORMAT_UNSUPPORTED_UNIT',
    {
      unit,
    },
    meta,
  );
}

function warnUnsupportedTimeZoneOnce(
  timeZone: string,
  locale: string,
  cause: unknown,
): void {
  const dedupKey = `${locale}|${timeZone}`;
  if (warnedTimeZoneKeys.has(dedupKey)) {
    return;
  }
  warnedTimeZoneKeys.add(dedupKey);
  const meta: Record<string, unknown> = {
    cause,
    locale,
    timeZone,
  };
  warnDiagnostic(
    'FORMAT_UNSUPPORTED_TIME_ZONE',
    {
      timeZone,
    },
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

function buildUnitFallback(
  locale: string,
  unit: string,
  options: object | undefined,
): Intl.NumberFormat {
  const numberOnly = new Intl.NumberFormat(locale, stripUnitFields(options));
  return {
    format: (value: number) => `${numberOnly.format(value)} ${unit}`,
  } as Intl.NumberFormat;
}

function buildTimeZoneFallback<T>(
  ctor: IntlFormatterCtor<T>,
  locale: string,
  options: object | undefined,
): T {
  return new ctor(locale, stripTimeZoneField(options));
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

function stripUnitFields(
  options: object | undefined,
): Intl.NumberFormatOptions {
  if (!options) {
    return {};
  }
  const {
    style: _style,
    unit: _unit,
    unitDisplay: _unitDisplay,
    ...rest
  } = options as Intl.NumberFormatOptions;
  return rest;
}

function stripTimeZoneField(
  options: object | undefined,
): Intl.DateTimeFormatOptions {
  if (!options) {
    return {};
  }
  const { timeZone: _timeZone, ...rest } =
    options as Intl.DateTimeFormatOptions;
  return rest;
}

function resolveValidLocale(locale: string): string {
  const cached = validLocaleCache.get(locale);
  if (cached !== undefined) {
    return cached;
  }
  let canonical: string;
  try {
    canonical = new Intl.Locale(locale).toString();
  } catch {
    if (!warnedInvalidLocales.has(locale)) {
      if (warnedInvalidLocales.size >= MAX_WARNED_INVALID_LOCALES) {
        const oldest = warnedInvalidLocales.values().next().value;
        if (oldest !== undefined) {
          warnedInvalidLocales.delete(oldest);
        }
      }
      warnedInvalidLocales.add(locale);
      warnDiagnostic('LOCALE_FORCED_INVALID', {
        defaultLocale,
        requested: locale,
      });
    }
    canonical = defaultLocale;
  }
  if (validLocaleCache.size >= MAX_VALID_LOCALES) {
    const oldest = validLocaleCache.keys().next().value;
    if (oldest !== undefined) {
      validLocaleCache.delete(oldest);
    }
  }
  validLocaleCache.set(locale, canonical);
  return canonical;
}
