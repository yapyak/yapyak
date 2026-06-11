// @ts-nocheck

import { useLocale } from '@yapyak/react';
import { t } from 'yapyak';

export function Greeting({ name }: { name: string }): string {
  const [locale] = useLocale();
  return `[${locale}] ${t('Hi {name}', {
    name,
  })}`;
}
