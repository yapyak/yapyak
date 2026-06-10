type IntlFormatterCtor<T> = new (locale: string, options?: object) => T;

const MAX_FORMATTERS_PER_CTOR = 64;

const caches = new Map<IntlFormatterCtor<unknown>, Map<string, unknown>>();

export function resolveFormatter<T>(
  ctor: IntlFormatterCtor<T>,
  locale: string,
  options: object | undefined,
): T {
  let cache = caches.get(ctor) as Map<string, T> | undefined;
  if (!cache) {
    cache = new Map();
    caches.set(ctor, cache as Map<string, unknown>);
  }
  const key = buildCanonicalKey(locale, options);
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const formatter = new ctor(locale, options);
  if (cache.size >= MAX_FORMATTERS_PER_CTOR) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, formatter);
  return formatter;
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
