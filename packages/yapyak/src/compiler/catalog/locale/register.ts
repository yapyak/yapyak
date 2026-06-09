import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Writes the locale-type augmentation to `<yapyakDir>/types.d.ts`.
 *
 * @remarks
 * Emits a `declare module 'yapyak'` block that narrows `Locale` to the configured locales. TypeScript picks it up when the consuming project includes the file in its `tsconfig.json`. No file is written when locales is empty.
 *
 * @param locales - The locales to declare in the `Locale` union.
 * @param yapyakDir - The directory to write `types.d.ts` into.
 */
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
