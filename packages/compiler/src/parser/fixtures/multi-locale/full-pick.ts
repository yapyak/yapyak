import { $createT, $t, useLocale } from '@yapyak/core';

const $tSv = $createT({ locale: 'sv' });

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
    $t('Hi {name}', { name }),
    $tSv('Welcome'),
    $t('You have {count, plural, one {# item} other {# items}}', { count }),
  ].join(' · ');
}
