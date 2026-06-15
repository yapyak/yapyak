import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeAtomic, writeAtomicAll } from './atomic';
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

describe('writeAtomicAll', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'yapyak-atomic-all-'));
  });

  afterEach(() => {
    rmSync(directory, {
      force: true,
      recursive: true,
    });
  });

  it('writes every target when all stages succeed', () => {
    const firstPath = join(directory, 'a.json');
    const secondPath = join(directory, 'b.json');
    writeAtomicAll([
      {
        content: '{"a":1}',
        path: firstPath,
      },
      {
        content: '{"b":2}',
        path: secondPath,
      },
    ]);
    expect(readFileSync(firstPath, 'utf-8')).toBe('{"a":1}');
    expect(readFileSync(secondPath, 'utf-8')).toBe('{"b":2}');
  });

  it('leaves every existing target untouched when staging fails', () => {
    const firstPath = join(directory, 'a.json');
    const secondPath = join(directory, 'missing', 'b.json');
    writeFileSync(firstPath, '{"a":"original"}');
    expect(() =>
      writeAtomicAll([
        {
          content: '{"a":1}',
          path: firstPath,
        },
        {
          content: '{"b":2}',
          path: secondPath,
        },
      ]),
    ).toThrow();
    expect(readFileSync(firstPath, 'utf-8')).toBe('{"a":"original"}');
  });

  it('leaves no `.tmp` artefacts after a failed staging', () => {
    const firstPath = join(directory, 'a.json');
    const secondPath = join(directory, 'missing', 'b.json');
    expect(() =>
      writeAtomicAll([
        {
          content: '{"a":1}',
          path: firstPath,
        },
        {
          content: '{"b":2}',
          path: secondPath,
        },
      ]),
    ).toThrow();
    const remaining = readdirSync(directory).filter((name) =>
      name.endsWith('.tmp'),
    );
    expect(remaining).toEqual([]);
  });

  it('leaves no `.tmp` artefacts after a successful write', () => {
    writeAtomicAll([
      {
        content: '{"a":1}',
        path: join(directory, 'a.json'),
      },
      {
        content: '{"b":2}',
        path: join(directory, 'b.json'),
      },
    ]);
    const remaining = readdirSync(directory).filter((name) =>
      name.endsWith('.tmp'),
    );
    expect(remaining).toEqual([]);
  });

  it('writes nothing when the list is empty', () => {
    writeAtomicAll([]);
    expect(readdirSync(directory)).toEqual([]);
  });
});
