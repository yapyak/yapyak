import { t } from 'yapyak';

export function greeting(name: string): string {
  return t('Hi {name}', { name });
}

export function inboxSummary(name: string, count: number): string {
  return t('Hi {name}, you have {count} messages', { count, name });
}
