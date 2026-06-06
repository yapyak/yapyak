import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface WriteRegisterInput {
  locales: readonly string[];
  yapyakDir: string;
}

/**
 * Writes `<yapyakDir>/types.d.ts` with a module augmentation that narrows yapyak's `Locale` type to the project's configured locales.
 *
 * @remarks
 * The generated file uses `declare module 'yapyak' { interface Register { Locale: ... } }`. TypeScript picks it up when the consuming project includes `<yapyakDir>` in its `tsconfig.json`. When no locales are configured, the file is not written and `Locale` falls back to `string`.
 *
 * @param input - Where to write and which locales to emit.
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
