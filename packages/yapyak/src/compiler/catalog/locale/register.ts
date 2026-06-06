import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface WriteRegisterInput {
  locales: string[];
  yapyakDir: string;
}

/**
 * Writes the locale-type augmentation to `<yapyakDir>/types.d.ts`.
 *
 * @remarks
 * Emits a `declare module 'yapyak'` block that narrows `Locale` to the configured locales. TypeScript picks it up when the consuming project includes the file in its `tsconfig.json`. No file is written when locales is empty.
 *
 * @param input - Input bundle. See {@link WriteRegisterInput}.
 */
export function writeRegister(input: WriteRegisterInput): void {
  if (input.locales.length === 0) {
    return;
  }
  mkdirSync(input.yapyakDir, { recursive: true });
  const localeUnion = input.locales.map((locale) => `'${locale}'`).join(' | ');
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
  writeFileSync(join(input.yapyakDir, 'types.d.ts'), content, 'utf8');
}
