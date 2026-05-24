import { getLocale, setLocale, useLocale } from '@yapyak/core';

export function current(): string {
  return getLocale();
}

export function switchTo(next: string): void {
  setLocale(next);
}

export function snapshot(): readonly [string, (next: string) => void] {
  return useLocale();
}
