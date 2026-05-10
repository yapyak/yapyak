import { getLocaleStore } from '../locale/store.js';
import { hasPlaceholder, interpolate } from './interpolate.js';

type Variant = string | ((params: never) => string);

export type LocaleVariants = Record<string, Variant>;

export type WithLocaleSchema = Record<string, LocaleVariants>;

export interface WithLocaleResult {
  in(locale: string): WithLocaleResult;
  [key: string]: unknown;
}

export function withLocale(schema: WithLocaleSchema): WithLocaleResult {
  return createProxy(schema, undefined) as WithLocaleResult;
}

function createProxy(
  schema: WithLocaleSchema,
  fixedLocale: string | undefined,
): unknown {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_, prop) {
      if (prop === 'in') {
        return (locale: string) => createProxy(schema, locale);
      }
      if (typeof prop !== 'string') {
        return undefined;
      }
      const variants = schema[prop];
      if (variants === undefined) {
        return undefined;
      }
      const store = getLocaleStore();
      const locale = fixedLocale ?? store.get();
      const value = variants[locale] ?? variants[store.defaultLocale];
      if (typeof value === 'string' && hasPlaceholder(value)) {
        return (params: Record<string, unknown>) => interpolate(value, params);
      }
      return value;
    },
    has(_, prop) {
      if (prop === 'in') {
        return true;
      }
      return typeof prop === 'string' && Object.hasOwn(schema, prop);
    },
    ownKeys() {
      return [...Object.keys(schema), 'in'];
    },
    getOwnPropertyDescriptor(_, prop) {
      if (
        prop === 'in' ||
        (typeof prop === 'string' && Object.hasOwn(schema, prop))
      ) {
        return { configurable: true, enumerable: true, value: undefined };
      }
      return undefined;
    },
  };
  return new Proxy({}, handler);
}
