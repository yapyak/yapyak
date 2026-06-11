// @ts-nocheck
import { t } from 'yapyak';

export function warn(name: string, age: number): string {
  return t('Hi {name}', {
    age,
    name,
  });
}
