import { $t } from '@yapyak/core';

export function bad(count: number): string {
  return $t('{count, plural, one {# item}}', { count });
}
