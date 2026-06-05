import { getLocale, setLocale, useLocale } from 'yapyak';

export function current(): string {
  return getLocale();
}

export function switchTo(next: string): void {
  setLocale(next);
}

export function snapshot(): [string, (next: string) => void] {
  return useLocale();
}
