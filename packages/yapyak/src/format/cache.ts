type IntlFormatterCtor<T> = new (locale: string, options?: object) => T;

const caches = new Map<IntlFormatterCtor<unknown>, Map<string, unknown>>();

export function getFormatter<T>(
  ctor: IntlFormatterCtor<T>,
  locale: string,
  options: object | undefined,
): T {
  let cache = caches.get(ctor) as Map<string, T> | undefined;
  if (cache === undefined) {
    cache = new Map();
    caches.set(ctor, cache as Map<string, unknown>);
  }
  const key = JSON.stringify([locale, options]);
  let formatter = cache.get(key);
  if (formatter === undefined) {
    formatter = new ctor(locale, options);
    cache.set(key, formatter);
  }
  return formatter;
}
