import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadYapyakConfig } from './load';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('loadYapyakConfig', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'yapyak-load-'));
  });

  afterEach(() => {
    rmSync(cwd, {
      force: true,
      recursive: true,
    });
  });

  it('returns the normalized default config when no config file exists', async () => {
    const result = await loadYapyakConfig(cwd);
    expect(result.configFile).toBeUndefined();
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

  it('loads a config from named exports when no `default` export exists', async () => {
    writeFileSync(
      join(cwd, 'yapyak.config.mjs'),
      `export const defaultLocale = 'sv';\n`,
    );
    const result = await loadYapyakConfig(cwd);
    expect(result.config.defaultLocale).toBe('sv');
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

  it('throws when the config module throws a non-Error value', async () => {
    writeFileSync(join(cwd, 'yapyak.config.ts'), `throw 'kaboom';\n`);
    await expect(loadYapyakConfig(cwd)).rejects.toThrow(
      /Failed to load yapyak config from .*: kaboom/,
    );
  });

  it('throws when the loaded module is `null`', async () => {
    writeFileSync(join(cwd, 'yapyak.config.js'), 'module.exports = null;\n');
    await expect(loadYapyakConfig(cwd)).rejects.toThrow(
      /expected an object, got null/,
    );
  });

  it('throws when the env file cannot be read', async () => {
    mkdirSync(join(cwd, '.env'));
    await expect(loadYapyakConfig(cwd)).rejects.toThrow(
      /Failed to load env file/,
    );
  });

  it('loads environment variables from `.env` when present', async () => {
    writeFileSync(join(cwd, '.env'), 'YAPYAK_TEST_LOAD=loaded\n');
    delete process.env.YAPYAK_TEST_LOAD;
    await loadYapyakConfig(cwd);
    expect(process.env.YAPYAK_TEST_LOAD).toBe('loaded');
    delete process.env.YAPYAK_TEST_LOAD;
  });

  it('loads environment variables from `.env.local` ahead of `.env`', async () => {
    writeFileSync(join(cwd, '.env'), 'YAPYAK_TEST_LOCAL=base\n');
    writeFileSync(join(cwd, '.env.local'), 'YAPYAK_TEST_LOCAL=override\n');
    delete process.env.YAPYAK_TEST_LOCAL;
    await loadYapyakConfig(cwd);
    expect(process.env.YAPYAK_TEST_LOCAL).toBe('override');
    delete process.env.YAPYAK_TEST_LOCAL;
  });
});
