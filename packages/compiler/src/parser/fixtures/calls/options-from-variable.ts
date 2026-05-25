import { $t } from 'yapyak';

const svOptions = { locale: 'sv' };

export function greeting(): string {
  return $t('Hello', undefined, svOptions);
}

export function farewell(): string {
  return $t('Bye', svOptions);
}

export function inboxSummary(name: string): string {
  return $t('Hi {name}', { name }, svOptions);
}
