import { $t } from '@yapyak/core';

export function bad(name: string): string {
  return $t(`Hi ${name}`);
}
