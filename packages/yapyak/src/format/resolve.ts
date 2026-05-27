import { getLocale } from '../locale';

interface Resolved<T> {
  locale: string;
  rest: Omit<T, 'locale'>;
}

export function resolveLocale<T extends { locale?: string }>(
  options: T | undefined,
): Resolved<T> {
  if (options === undefined) {
    return { locale: getLocale(), rest: {} as Omit<T, 'locale'> };
  }
  const { locale, ...rest } = options;
  return {
    locale: locale ?? getLocale(),
    rest: rest as Omit<T, 'locale'>,
  };
}
