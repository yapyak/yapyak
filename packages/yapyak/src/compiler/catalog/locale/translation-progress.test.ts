import type { TranslationProgress } from './translation-progress';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  isTranslationRunning,
  readTranslationProgress,
  writeTranslationProgress,
} from './translation-progress';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EXITED_PID = 2 ** 31 - 1;

function buildProgress(
  overrides?: Partial<TranslationProgress>,
): TranslationProgress {
  return {
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
    ...overrides,
  };
}

describe('isTranslationRunning', () => {
  it('returns `true` when the run is unfinished and its process is alive', () => {
    expect(isTranslationRunning(buildProgress())).toBe(true);
  });

  it('returns `false` when the run has finished', () => {
    expect(
      isTranslationRunning(
        buildProgress({
          finishedAt: '2025-01-01T00:00:01.000Z',
        }),
      ),
    ).toBe(false);
  });

  it('returns `false` when the process has exited', () => {
    expect(
      isTranslationRunning(
        buildProgress({
          pid: EXITED_PID,
        }),
      ),
    ).toBe(false);
  });
});

describe('readTranslationProgress', () => {
  let yapyakDir: string;

  beforeEach(() => {
    yapyakDir = mkdtempSync(join(tmpdir(), 'yapyak-progress-'));
  });

  afterEach(() => {
    rmSync(yapyakDir, {
      force: true,
      recursive: true,
    });
  });

  it('returns the progress when the file holds a valid record', () => {
    const progress = buildProgress({
      errors: [
        {
          fileId: 'src/a.tsx',
          locale: 'sv',
          message: 'Translate batch aborted.',
          source: 'Hello',
        },
      ],
    });
    writeFileSync(join(yapyakDir, 'progress.json'), JSON.stringify(progress));

    expect(readTranslationProgress(yapyakDir)).toEqual(progress);
  });

  it('returns undefined when the file is missing', () => {
    expect(readTranslationProgress(yapyakDir)).toBeUndefined();
  });

  it('returns undefined when the file is not JSON', () => {
    writeFileSync(join(yapyakDir, 'progress.json'), '{');

    expect(readTranslationProgress(yapyakDir)).toBeUndefined();
  });

  it('returns undefined when the record has the wrong shape', () => {
    writeFileSync(
      join(yapyakDir, 'progress.json'),
      JSON.stringify(
        buildProgress({
          pid: 0,
        }),
      ),
    );

    expect(readTranslationProgress(yapyakDir)).toBeUndefined();
  });
});

describe('writeTranslationProgress', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-progress-'));
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
  });

  it('writes the progress to `progress.json` in canonical JSON form', () => {
    const yapyakDir = join(root, '.yapyak');
    writeTranslationProgress(yapyakDir, buildProgress());

    expect(readFileSync(join(yapyakDir, 'progress.json'), 'utf-8')).toBe(
      `${JSON.stringify(buildProgress(), null, 2)}\n`,
    );
  });

  it('writes the parent directory when missing', () => {
    const yapyakDir = join(root, 'nested', '.yapyak');
    writeTranslationProgress(yapyakDir, buildProgress());

    expect(existsSync(join(yapyakDir, 'progress.json'))).toBe(true);
  });
});
