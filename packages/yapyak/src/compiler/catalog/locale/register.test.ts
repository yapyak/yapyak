import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeRegister } from './register';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('writeRegister', () => {
  let yapyakDir: string;

  beforeEach(() => {
    yapyakDir = mkdtempSync(join(tmpdir(), 'yapyak-register-'));
  });

  afterEach(() => {
    rmSync(yapyakDir, {
      force: true,
      recursive: true,
    });
  });

  it('writes a single-locale union', () => {
    writeRegister(
      [
        'en',
      ],
      yapyakDir,
    );
    const content = readFileSync(join(yapyakDir, 'types.d.ts'), 'utf8');
    expect(content).toBe(
      `declare module 'yapyak' {
  interface Register {
    Locale: 'en';
  }
}

export {};
`,
    );
  });

  it('writes a multi-locale union in the order given', () => {
    writeRegister(
      [
        'en',
        'sv',
        'da',
      ],
      yapyakDir,
    );
    const content = readFileSync(join(yapyakDir, 'types.d.ts'), 'utf8');
    expect(content).toContain(`Locale: 'en' | 'sv' | 'da';`);
  });

  it('writes BCP 47 region and script variants verbatim', () => {
    writeRegister(
      [
        'en-US',
        'pt-BR',
        'zh-Hans-CN',
      ],
      yapyakDir,
    );
    const content = readFileSync(join(yapyakDir, 'types.d.ts'), 'utf8');
    expect(content).toContain(`Locale: 'en-US' | 'pt-BR' | 'zh-Hans-CN';`);
  });

  it('writes no file when locales is empty', () => {
    writeRegister([], yapyakDir);
    expect(existsSync(join(yapyakDir, 'types.d.ts'))).toBe(false);
  });

  it('writes the file when yapyakDir is missing', () => {
    const nested = join(yapyakDir, 'does', 'not', 'exist');
    writeRegister(
      [
        'en',
      ],
      nested,
    );
    expect(existsSync(join(nested, 'types.d.ts'))).toBe(true);
  });

  it('writes the new union when called twice', () => {
    writeRegister(
      [
        'en',
      ],
      yapyakDir,
    );
    writeRegister(
      [
        'sv',
      ],
      yapyakDir,
    );
    const content = readFileSync(join(yapyakDir, 'types.d.ts'), 'utf8');
    expect(content).toContain(`Locale: 'sv';`);
    expect(content).not.toContain(`'en'`);
  });
});
