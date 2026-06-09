import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function writeRegister(locales: string[], yapyakDir: string): void {
  if (locales.length === 0) {
    return;
  }
  mkdirSync(yapyakDir, { recursive: true });
  const localeUnion = locales.map((locale) => `'${locale}'`).join(' | ');
  const content = [
    `declare module 'yapyak' {`,
    '  interface Register {',
    `    Locale: ${localeUnion};`,
    '  }',
    '}',
    '',
    'export {};',
    '',
  ].join('\n');
  writeFileSync(join(yapyakDir, 'types.d.ts'), content, 'utf8');
}
