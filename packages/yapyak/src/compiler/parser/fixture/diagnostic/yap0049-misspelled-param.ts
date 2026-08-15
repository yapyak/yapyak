// @ts-nocheck
import { t } from 'yapyak';

export function bad(conut: number): string {
  return t('You have {count, plural, one {# item} other {# items}}', {
    conut,
  });
}
