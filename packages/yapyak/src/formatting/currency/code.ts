import type { CurrencyCode } from './known';

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

export function isCurrencyCode(value: string): value is CurrencyCode {
  return getSupportedCurrencies().has(value);
}
