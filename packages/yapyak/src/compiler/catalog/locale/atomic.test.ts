import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeAtomic } from './atomic';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('writeAtomic', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'yapyak-atomic-'));
  });

  afterEach(() => {
    rmSync(directory, {
      force: true,
      recursive: true,
    });
  });

  it('writes the content to the target path', () => {
    const path = join(directory, 'data.json');
    writeAtomic(path, '{"key":"value"}');
    expect(readFileSync(path, 'utf-8')).toBe('{"key":"value"}');
  });

  it('transforms existing content into the new bytes', () => {
    const path = join(directory, 'data.json');
    writeFileSync(path, '{"old":"value"}');
    writeAtomic(path, '{"new":"value"}');
    expect(readFileSync(path, 'utf-8')).toBe('{"new":"value"}');
  });

  it('writes no `.tmp` artefact after a successful write', () => {
    const path = join(directory, 'data.json');
    writeAtomic(path, '{"key":"value"}');
    const remaining = readdirSync(directory).filter((name) =>
      name.endsWith('.tmp'),
    );
    expect(remaining).toEqual([]);
  });

  it('preserves the original file when the rename target is invalid', () => {
    const path = join(directory, 'missing', 'data.json');
    expect(() => writeAtomic(path, '{"key":"value"}')).toThrow();
    expect(readdirSync(directory)).toEqual([]);
  });

  it('throws when the directory does not exist', () => {
    const path = join(directory, 'missing', 'data.json');
    expect(() => writeAtomic(path, '{"key":"value"}')).toThrow();
  });
});
