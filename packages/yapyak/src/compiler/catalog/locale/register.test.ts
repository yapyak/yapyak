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
    rmSync(yapyakDir, { force: true, recursive: true });
  });

  it('emits a single-locale union', () => {
    writeRegister({ locales: ['en'], yapyakDir });
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

  it('emits a multi-locale union in the order given', () => {
    writeRegister({ locales: ['en', 'sv', 'dk'], yapyakDir });
    const content = readFileSync(join(yapyakDir, 'types.d.ts'), 'utf8');
    expect(content).toContain(`Locale: 'en' | 'sv' | 'dk';`);
  });

  it('emits BCP 47 region and script variants verbatim', () => {
    writeRegister({
      locales: ['en-US', 'pt-BR', 'zh-Hans-CN'],
      yapyakDir,
    });
    const content = readFileSync(join(yapyakDir, 'types.d.ts'), 'utf8');
    expect(content).toContain(`Locale: 'en-US' | 'pt-BR' | 'zh-Hans-CN';`);
  });

  it('skips writing when locales is empty', () => {
    writeRegister({ locales: [], yapyakDir });
    expect(existsSync(join(yapyakDir, 'types.d.ts'))).toBe(false);
  });

  it('creates yapyakDir when it does not exist', () => {
    const nested = join(yapyakDir, 'does', 'not', 'exist');
    writeRegister({ locales: ['en'], yapyakDir: nested });
    expect(existsSync(join(nested, 'types.d.ts'))).toBe(true);
  });

  it('overwrites an existing file', () => {
    writeRegister({ locales: ['en'], yapyakDir });
    writeRegister({ locales: ['sv'], yapyakDir });
    const content = readFileSync(join(yapyakDir, 'types.d.ts'), 'utf8');
    expect(content).toContain(`Locale: 'sv';`);
    expect(content).not.toContain(`'en'`);
  });
});
