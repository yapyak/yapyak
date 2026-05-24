import { $t } from '@yapyak/core';

export function warn(flag: boolean): string {
  if (flag) {
    const t = $t;
    return t('Hello');
  }
  return $t('Goodbye');
}
