import { $t, useLocale } from '@yapyak/core';

export function Greeting({ name }: { name: string }): string {
  const [locale] = useLocale();
  return `[${locale}] ${$t('Hi {name}', { name })}`;
}
