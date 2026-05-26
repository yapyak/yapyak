import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeLocaleFile, YapyakInvariantError } from './writer';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('writeLocaleFile invariant', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yapyak-writer-'));
    path = join(dir, 'sv.json');
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('throws when a still-used non-empty value would be cleared to empty string', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    expect(() =>
      writeLocaleFile({
        after: { 'src/a.tsx': { Hello: '' } },
        extractedSources: { 'src/a.tsx': new Set(['Hello']) },
        filePath: path,
      }),
    ).toThrow(YapyakInvariantError);
  });

  it('throws when a still-used non-empty value would be removed entirely', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    expect(() =>
      writeLocaleFile({
        after: { 'src/a.tsx': {} },
        extractedSources: { 'src/a.tsx': new Set(['Hello']) },
        filePath: path,
      }),
    ).toThrow(YapyakInvariantError);
  });

  it('allows clearing a value when source is no longer extracted', () => {
    writeFileSync(
      path,
      JSON.stringify({ 'src/a.tsx': { Hello: 'Hej', World: 'Världen' } }),
    );

    writeLocaleFile({
      after: { 'src/a.tsx': { World: 'Världen' } },
      extractedSources: { 'src/a.tsx': new Set(['World']) },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': { World: 'Världen' },
    });
  });

  it('allows clearing values when fileId has no extracted sources', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    writeLocaleFile({
      after: {},
      extractedSources: {},
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({});
  });

  it('allows writing a new translation value', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: '' } }));

    writeLocaleFile({
      after: { 'src/a.tsx': { Hello: 'Hej' } },
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': { Hello: 'Hej' },
    });
  });

  it('preserves non-empty values across writes when source still extracted', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    writeLocaleFile({
      after: { 'src/a.tsx': { Hello: 'Hej' } },
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': { Hello: 'Hej' },
    });
  });

  it('lists all violations in the error message', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': { Hello: 'Hej', World: 'Världen' },
      }),
    );

    try {
      writeLocaleFile({
        after: { 'src/a.tsx': { Hello: '', World: '' } },
        extractedSources: { 'src/a.tsx': new Set(['Hello', 'World']) },
        filePath: path,
      });
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(YapyakInvariantError);
      const invariantError = error as YapyakInvariantError;
      expect(invariantError.violations).toHaveLength(2);
      expect(invariantError.violations.map((v) => v.source).sort()).toEqual([
        'Hello',
        'World',
      ]);
    }
  });

  it('creates the locales directory if missing', () => {
    const nested = join(dir, 'deep', 'nested', 'sv.json');

    writeLocaleFile({
      after: { 'src/a.tsx': { Hello: 'Hej' } },
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: nested,
    });

    expect(JSON.parse(readFileSync(nested, 'utf8'))).toEqual({
      'src/a.tsx': { Hello: 'Hej' },
    });
  });

  it('does not write the file when invariant is violated', () => {
    const before = JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } });
    writeFileSync(path, before);
    mkdirSync(join(dir, 'untouched'), { recursive: true });

    expect(() =>
      writeLocaleFile({
        after: { 'src/a.tsx': { Hello: '' } },
        extractedSources: { 'src/a.tsx': new Set(['Hello']) },
        filePath: path,
      }),
    ).toThrow();

    expect(readFileSync(path, 'utf8')).toBe(before);
  });
});
