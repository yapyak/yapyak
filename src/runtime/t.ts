import { hasPlaceholder, interpolate } from './interpolate.js';
import { pick } from './pick.js';

export interface T {
  (source: string, params?: Record<string, unknown>): string;
  in(locale: string): TInLocale;
}

export type TInLocale = (
  source: string,
  params?: Record<string, unknown>,
) => string;

function call(source: string, params?: Record<string, unknown>): string {
  if (params === undefined || !hasPlaceholder(source)) {
    return source;
  }
  return interpolate(source, params);
}

function inLocale(locale: string): TInLocale {
  return (source, params) =>
    pick({ [locale]: source }, params, locale);
}

const fn = call as T;
fn.in = inLocale;

export const t: T = fn;
