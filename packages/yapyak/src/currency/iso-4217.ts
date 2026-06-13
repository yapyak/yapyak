import type { KnownCurrencyCode } from './known';

declare const brand: unique symbol;

/**
 * A currency code that passed runtime validation against {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf | `Intl.supportedValuesOf('currency')`}.
 *
 * @remarks
 * Returned by {@link parseCurrencyCode} and narrowed by {@link isCurrencyCode}. Brand-typed so the proof of validity flows through the call site — once a value carries this type, downstream code can assume `Intl.NumberFormat` will accept it.
 */
export type CurrencyCode = string & {
  readonly [brand]: 'CurrencyCode';
};

/**
 * The shape of a `currency` argument: any known ISO 4217 code for autocomplete, or any string from runtime sources (DB rows, API responses, props).
 *
 * @remarks
 * Backed by the `LiteralUnion` pattern — `(string & {})` keeps autocomplete suggestions visible while permitting arbitrary runtime strings. Use {@link parseCurrencyCode} when you need a {@link CurrencyCode} brand for downstream code.
 */
export type CurrencyCodeInput = KnownCurrencyCode | (string & {});

let cachedSupported: Set<string> | undefined;

function getSupportedCurrencies(): Set<string> {
  if (cachedSupported) {
    return cachedSupported;
  }
  try {
    cachedSupported = new Set(Intl.supportedValuesOf('currency'));
  } catch {
    cachedSupported = new Set();
  }
  return cachedSupported;
}

/**
 * Narrows a string to {@link CurrencyCode} when it is supported by the host runtime's `Intl`.
 *
 * @remarks
 * Reads {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf | `Intl.supportedValuesOf('currency')`} once and caches the set, so calls are O(1). The check is case-sensitive — pass an uppercase code.
 *
 * @param value - The candidate code.
 *
 * @example Guard a runtime value before formatting
 * ```ts
 * import { format, isCurrencyCode } from 'yapyak';
 *
 * if (isCurrencyCode(row.currency)) {
 *   render(format.currency(row.amount, row.currency));
 * }
 * ```
 */
export function isCurrencyCode(value: string): value is CurrencyCode {
  return getSupportedCurrencies().has(value);
}

/**
 * Parses a candidate string into a {@link CurrencyCode}, upper-casing it first.
 *
 * @remarks
 * Returns `null` when the host runtime's `Intl` does not support the code. The "parse, don't validate" pattern — once you hold a non-null result, downstream code carries the brand and is statically known to be safe for `Intl.NumberFormat`.
 *
 * @param value - The candidate code.
 *
 * @example Validate at the boundary, format with the brand
 * ```ts
 * import { format, parseCurrencyCode } from 'yapyak';
 *
 * const code = parseCurrencyCode(row.currency);
 * if (code) {
 *   render(format.currency(row.amount, code));
 * }
 * ```
 */
export function parseCurrencyCode(value: string): CurrencyCode | null {
  const upper = value.toUpperCase();
  return getSupportedCurrencies().has(upper) ? (upper as CurrencyCode) : null;
}
