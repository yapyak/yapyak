import { $t } from '@yapyak/core';

export function greeting(): string {
  return $t('Hello');
}

export function farewell(): string {
  return $t('Goodbye');
}
