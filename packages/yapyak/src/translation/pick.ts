import { defaultLocale, getLocale } from '../locale';
import { interpolate } from './interpolate';
import { hasPlaceholder } from './placeholder';
import { runTrackers } from './tracker';

type Variants = Record<string, string>;

interface PickOptions {
  locale?: string;
}

export function pick(
  variants: Variants,
  paramsOrOptions?: Record<string, unknown> | PickOptions,
  maybeOptions?: PickOptions,
): string {
  const sample = variants[defaultLocale] ?? Object.values(variants)[0] ?? '';
  const sourceHasPlaceholder = hasPlaceholder(sample);

  let params: Record<string, unknown> | undefined;
  let options: PickOptions | undefined;
  if (sourceHasPlaceholder) {
    params = paramsOrOptions as Record<string, unknown> | undefined;
    options = maybeOptions;
  } else {
    options =
      (paramsOrOptions as PickOptions | undefined) ?? maybeOptions;
  }

  runTrackers();
  const active = options?.locale ?? getLocale();
  const value = variants[active] ?? variants[defaultLocale] ?? '';
  if (!params || !hasPlaceholder(value)) {
    return value;
  }
  return interpolate(value, params, active);
}
