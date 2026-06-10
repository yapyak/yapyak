import { t } from 'yapyak';

export function warn(extras: Record<string, unknown>): string {
  return t('Hi {name}', {
    ...extras,
  });
}
