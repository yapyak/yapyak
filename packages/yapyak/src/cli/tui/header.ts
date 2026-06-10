import { color } from './color';

export function header(title: string, subtitle?: string): string {
  const lines = [
    color.bold(title),
  ];
  if (subtitle) {
    lines.push(color.dim(subtitle));
  }
  return `\n  ${lines.join('  ')}\n`;
}
