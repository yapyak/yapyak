import { hasPlaceholder, interpolate } from './runtime/interpolate.js';

export type SchemaValue = string | Schema;

export interface Schema {
  [key: string]: SchemaValue;
}

type HasPlaceholder<T extends string> = T extends `${string}{${string}}${string}`
  ? true
  : false;

type IsValidName<T extends string> = T extends ''
  ? false
  : T extends `${string} ${string}`
    ? false
    : T extends `${string}#${string}`
      ? false
      : T extends `=${string}`
        ? false
        : true;

type NamedParam<Name extends string, Value> = IsValidName<Name> extends true
  ? { [K in Name]: Value }
  : Record<never, never>;

type ParseToken<T extends string> = T extends `${infer Name}, plural,${string}`
  ? NamedParam<Name, number>
  : T extends `${infer Name}, selectordinal,${string}`
    ? NamedParam<Name, number>
    : T extends `${infer Name}, number${string}`
      ? NamedParam<Name, number>
      : T extends `${infer Name},${string}`
        ? NamedParam<Name, string>
        : NamedParam<T, string>;

type ExtractParams<T extends string> =
  T extends `${string}{${infer Token}}${infer Rest}`
    ? ParseToken<Token> & ExtractParams<Rest>
    : Record<never, never>;

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type TranslationValue<V> = V extends string
  ? HasPlaceholder<V> extends true
    ? (params: Prettify<ExtractParams<V>>) => string
    : string
  : V extends Schema
    ? TranslationsCore<V>
    : never;

type TranslationsCore<S extends Schema> = {
  [K in keyof S]: TranslationValue<S[K]>;
};

export type Translations<S extends Schema> = TranslationsCore<S> & {
  in(locale: string): Translations<S>;
};

export function defineTranslations<const S extends Schema>(
  schema: S,
): Translations<S> {
  return createProxy(schema) as Translations<S>;
}

function createProxy(schema: Schema): unknown {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_, prop) {
      if (prop === 'in') {
        return (_locale: string) => createProxy(schema);
      }
      if (typeof prop !== 'string') {
        return undefined;
      }
      const value = schema[prop];
      if (value === undefined) {
        return undefined;
      }
      if (typeof value === 'string') {
        return hasPlaceholder(value) ? makeInterpolator(value) : value;
      }
      return createProxy(value);
    },
    has(_, prop) {
      if (prop === 'in') {
        return true;
      }
      return typeof prop === 'string' && prop in schema;
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

function makeInterpolator(
  template: string,
): (params: Record<string, unknown>) => string {
  return (params) => interpolate(template, params);
}
