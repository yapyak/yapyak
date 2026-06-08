import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadYapyakConfig } from './load';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('loadYapyakConfig', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'yapyak-load-'));
  });

  afterEach(() => {
    rmSync(cwd, { force: true, recursive: true });
  });

  it('returns the normalized default config when no config file exists', async () => {
    const result = await loadYapyakConfig(cwd);
    expect(result.configFile).toBeNull();
    expect(result.config.defaultLocale).toBe('en');
  });

  it('loads `yapyak.config.ts` and returns the normalized config', async () => {
    writeFileSync(
      join(cwd, 'yapyak.config.ts'),
      `export default { defaultLocale: 'sv', localesDir: 'lang' };\n`,
    );
    const result = await loadYapyakConfig(cwd);
    expect(result.configFile).toBe(join(cwd, 'yapyak.config.ts'));
    expect(result.config.defaultLocale).toBe('sv');
    expect(result.config.localesDir).toBe('lang');
  });

  it('throws when the config file fails to parse', async () => {
    writeFileSync(join(cwd, 'yapyak.config.ts'), 'this is not valid ts');
    await expect(loadYapyakConfig(cwd)).rejects.toThrow(
      /Failed to load yapyak config/,
    );
  });

  it('throws when the loaded module is not an object', async () => {
    writeFileSync(
      join(cwd, 'yapyak.config.mjs'),
      'export default "not an object";\n',
    );
    await expect(loadYapyakConfig(cwd)).rejects.toThrow(/expected an object/);
  });
});
