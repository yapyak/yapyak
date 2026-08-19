import type { Project } from './resolve';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { invalidateProjectMessages, resolveProjectMessages } from './message';
import { resolveProject } from './resolve';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOAD_TIMEOUT_MILLISECONDS = 30_000;

let project: Project;
let root: string;

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'yapyak-vscode-message-'));
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'yapyak.config.mjs'), 'export default {};\n');
  writeFileSync(
    join(root, 'src', 'a.ts'),
    "import { t } from 'yapyak';\nexport const a = t('Hello');\n",
  );
  writeFileSync(join(root, 'src', 'b.ts'), 'export const b = 1;\n');
  const resolved = await resolveProject(root);
  if (resolved === undefined) {
    throw new Error('yapyak is not installed next to the extension.');
  }
  project = resolved;
}, LOAD_TIMEOUT_MILLISECONDS);

afterEach(() => {
  invalidateProjectMessages(root);
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('invalidateProjectMessages', () => {
  it('clears the cached result for the root', () => {
    const before = resolveProjectMessages(project);
    invalidateProjectMessages(root);

    expect(resolveProjectMessages(project)).not.toBe(before);
  });
});

describe('resolveProjectMessages', () => {
  it('collects the messages of every source file', () => {
    const result = resolveProjectMessages(project);

    expect(result.messages.map((message) => message.source)).toEqual([
      'Hello',
    ]);
    expect(result.sourceFileIds).toEqual([
      'src/a.ts',
      'src/b.ts',
    ]);
  });

  it('returns the cached result for the same root', () => {
    const first = resolveProjectMessages(project);

    expect(resolveProjectMessages(project)).toBe(first);
  });
});
