import { t } from 'yapyak';

declare const previewLocale: { value: string };

export function greeting(): string {
  return t.in(previewLocale.value)('Hello');
}

export function farewell(name: string): string {
  return t.in(previewLocale.value)('Bye {name}', { name });
}
