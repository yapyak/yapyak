import { $t, useLocale } from 'yapyak';

declare const previewLocale: { value: string };

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
    $t('Welcome', undefined, { locale: 'sv' }),
    $t('Bye', undefined, { locale: previewLocale.value }),
    $t('You have {count, plural, one {# item} other {# items}}', { count }),
  ].join(' · ');
}
