import { $t } from 'yapyak';

export function outer(): string {
  if (Math.random() > 0.5) {
    const t = $t;
    return t('Hello');
  }
  return $t('Hello');
}
