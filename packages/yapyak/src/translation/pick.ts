import type { Template } from '../template';

import { defaultLocale, getLocale } from '../locale';
import { interpret } from '../template';
import { runTrackers } from '../tracker';

type Variants = Record<string, string | Template>;

interface PickOptions {
  locale?: string;
}

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
  const variant = variants[active] ?? variants[defaultLocale] ?? '';
  if (typeof variant === 'string') {
    return variant;
  }
  return interpret(variant, params ?? {}, active);
}
