import { defaultLocale, getLocale } from '../locale';
import { hasPlaceholder, interpolate } from './interpolate';
import { runTrackers } from './tracker';

type Variants = Record<string, string>;

interface PickOptions {
  context?: string;
  locale?: string;
}

/** @internal */
export function _$pick(
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
    options = paramsOrOptions as PickOptions | undefined;
  }

  runTrackers();
  const active = options?.locale ?? getLocale();
  const value = variants[active] ?? variants[defaultLocale] ?? '';
  if (params === undefined || !hasPlaceholder(value)) {
    return value;
  }
  return interpolate(value, params, active);
}
