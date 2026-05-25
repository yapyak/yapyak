import { $t } from 'yapyak';

export function greeting(name: string, count: number): string {
  return $t('Hi {name}, you have {count} messages', { count, name });
}
