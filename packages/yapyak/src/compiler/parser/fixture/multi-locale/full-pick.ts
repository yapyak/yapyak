// @ts-nocheck

import { useLocale } from '@yapyak/react';
import { t } from 'yapyak';

declare const previewLocale: {
  value: string;
};

export function Greeting({
  name,
  count,
}: {
  name: string;
  count: number;
}): string {
  const [locale, setLocale] = useLocale();
  setLocale(locale);
  return [
    t('Hi {name}', {
      name,
    }),
    t.in('sv', 'Hello'),
    t.in(previewLocale.value, 'Bye'),
    t('You have {count, plural, one {# item} other {# items}}', {
      count,
    }),
  ].join(' · ');
}
