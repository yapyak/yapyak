// @ts-nocheck

import { useLocale } from '@yapyak/react';
import { getLocale, setLocale } from 'yapyak';

export function current(): string {
  return getLocale();
}

export function switchTo(next: string): void {
  setLocale(next);
}

export function snapshot(): [
  string,
  (next: string) => void,
] {
  return useLocale();
}
