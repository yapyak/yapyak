import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadConfig, resetConfigCache } from './config';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('loadConfig', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-cli-config-'));
    resetConfigCache();
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
    resetConfigCache();
  });

  it('returns the normalized default config when no config file exists', async () => {
    const config = await loadConfig(root);
    expect(config.defaultLocale).toBe('en');
    expect(config.translator).toBeUndefined();
  });

  it('returns the cached config on a second call with the same `projectRoot`', async () => {
    writeFileSync(
      join(root, 'yapyak.config.ts'),
      `export default { defaultLocale: 'sv' };\n`,
    );
    const first = await loadConfig(root);
    const second = await loadConfig(root);
    expect(second).toBe(first);
  });
});
