// @ts-nocheck
import { t } from 'yapyak';

export function outer(): string {
  if (Math.random() > 0.5) {
    const translate = t;
    return translate('Hello');
  }
  return t('Hello');
}
