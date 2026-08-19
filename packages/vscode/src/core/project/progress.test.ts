import type { Project } from './resolve';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readProjectProgress } from './progress';
import { resolveProject } from './resolve';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOAD_TIMEOUT_MILLISECONDS = 30_000;

let project: Project;
let root: string;

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'yapyak-vscode-progress-'));
  writeFileSync(
    join(root, 'yapyak.config.mjs'),
    "export default { defaultLocale: 'en' };\n",
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

describe('readProjectProgress', () => {
  it('returns the progress when `.yapyak/progress.json` exists', () => {
    mkdirSync(join(root, '.yapyak'));
    writeFileSync(
      join(root, '.yapyak', 'progress.json'),
      JSON.stringify({
        errors: [],
        finishedAt: null,
        id: 'run-1',
        locales: [
          'sv',
        ],
        pid: process.pid,
        startedAt: '2025-01-01T00:00:00.000Z',
        total: 1,
        translated: 0,
      }),
    );

    expect(readProjectProgress(project)?.total).toBe(1);
  });

  it('returns undefined when the project has no progress file', () => {
    expect(readProjectProgress(project)).toBeUndefined();
  });
});
