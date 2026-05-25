import { $t } from 'yapyak';

declare const previewLocale: { value: string };

export function greeting(): string {
  return $t('Hello', undefined, { locale: previewLocale.value });
}

export function farewell(name: string): string {
  return $t('Bye {name}', { name }, { locale: previewLocale.value });
}
