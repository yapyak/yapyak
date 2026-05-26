import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { syncLocaleFiles } from './files';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('syncLocaleFiles', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-sync-'));
  });

  afterEach(() => {
    rmSync(projectRoot, { force: true, recursive: true });
  });

  it('refuses to overwrite a non-empty locale file when no messages were extracted', () => {
    const localesDir = 'locales';
    const localePath = join(projectRoot, localesDir, 'sv.json');
    const existing = { 'src/a.ts': { hello: 'hej' } };
    mkdirSync(join(projectRoot, localesDir), { recursive: true });
    writeFileSync(localePath, JSON.stringify(existing));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [],
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual(existing);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Refusing to overwrite'),
    );

    warn.mockRestore();
  });

  it('writes an empty file when no messages are extracted and existing is empty', () => {
    const localesDir = 'locales';
    const localePath = join(projectRoot, localesDir, 'sv.json');

    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [],
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({});
  });
});
