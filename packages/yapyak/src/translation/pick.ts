import type { Template } from '../template/internal';

import { defaultLocale, getLocale, getLocaleFallbackChain } from '../locale';
import { interpret } from '../template/internal';
import { runTrackers } from '../tracker';

export type Variants = Record<string, string | Template>;

type PickOptions = {
  locale?: string;
};

export function pick(
  variants: Variants,
  paramsOrOptions?: PickOptions | Record<string, unknown>,
  maybeOptions?: PickOptions,
): string {
  const hasDynamicVariant = Object.values(variants).some(
    (variant) => typeof variant !== 'string',
  );

  let params: Record<string, unknown> | undefined;
  let options: PickOptions | undefined;
  if (hasDynamicVariant) {
    params = paramsOrOptions as Record<string, unknown> | undefined;
    options = maybeOptions;
  } else {
    options = (paramsOrOptions as PickOptions | undefined) ?? maybeOptions;
  }

  runTrackers();
  const active = options?.locale ?? getLocale();
  const variant = pickVariant(variants, active, defaultLocale);
  if (typeof variant === 'string') {
    return variant;
  }
  return interpret(variant, params ?? {}, active);
}

function pickVariant(
  variants: Variants,
  active: string,
  fallback: string,
): string | Template {
  for (const candidate of getLocaleFallbackChain(active)) {
    if (Object.hasOwn(variants, candidate)) {
      return variants[candidate] ?? '';
    }
  }
  for (const candidate of getLocaleFallbackChain(fallback)) {
    if (Object.hasOwn(variants, candidate)) {
      return variants[candidate] ?? '';
    }
  }
  return '';
}
