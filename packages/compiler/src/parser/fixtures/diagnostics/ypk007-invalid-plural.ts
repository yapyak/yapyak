import { $t } from 'yapyak';

export function bad(count: number): string {
  return $t('{count, plural, one {# item}}', { count });
}
