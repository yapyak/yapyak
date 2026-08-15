// @ts-nocheck
import { t } from 'yapyak';

export function bad(): string {
  return t('Hi {first name}');
}

export function worse(first: string): string {
  return t('Hi {first name}', {
    'first name': first,
  });
}
