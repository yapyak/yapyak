import { $t } from '@yapyak/core';

export function warn(name: string, age: number): string {
  return $t('Hi {name}', { age, name });
}
