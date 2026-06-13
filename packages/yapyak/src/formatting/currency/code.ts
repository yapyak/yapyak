import type { Currency } from './known';

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

export function isCurrency(value: string): value is Currency {
  return getSupportedCurrencies().has(value);
}
