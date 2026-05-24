import { $t } from '@yapyak/core';

export function outer(): string {
  if (Math.random() > 0.5) {
    const t = (s: string): string => s.toUpperCase();
    return t('Hello');
  }
  return $t('Hello');
}
