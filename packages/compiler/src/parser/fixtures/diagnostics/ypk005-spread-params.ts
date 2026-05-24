import { $t } from '@yapyak/core';

export function warn(extras: Record<string, unknown>): string {
  return $t('Hi {name}', { ...extras });
}
