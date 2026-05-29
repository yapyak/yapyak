import { t } from 'yapyak';

const sv = t.in('sv');

export function greeting(): string {
  return sv('Hello');
}

export function inboxSummary(name: string): string {
  return sv('Hi {name}', { name });
}
