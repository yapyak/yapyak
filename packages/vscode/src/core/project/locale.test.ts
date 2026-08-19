import type { Project } from './resolve';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readProjectLocales } from './locale';
import { resolveProject } from './resolve';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOAD_TIMEOUT_MILLISECONDS = 30_000;

let project: Project;
let root: string;

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'yapyak-vscode-locale-'));
  mkdirSync(join(root, 'locales'));
  writeFileSync(
    join(root, 'yapyak.config.mjs'),
    "export default { defaultLocale: 'sv' };\n",
  );
  writeFileSync(
    join(root, 'locales', 'de.json'),
    JSON.stringify({
      'src/a.tsx': {
        Hello: 'Hallo',
      },
    }),
  );
  const resolved = await resolveProject(root);
  if (resolved === undefined) {
    throw new Error('yapyak is not installed next to the extension.');
  }
  project = resolved;
}, LOAD_TIMEOUT_MILLISECONDS);

afterEach(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('readProjectLocales', () => {
  it('reads the locales next to the configured default locale', () => {
    const { defaultLocale, localeData, locales } = readProjectLocales(project);

    expect(defaultLocale).toBe('sv');
    expect(locales).toEqual([
      'de',
      'sv',
    ]);
    expect(localeData.de?.['src/a.tsx']?.Hello).toBe('Hallo');
  });
});
