import type { LocaleFile } from './file';

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

  it('handles every combination of (before, after, extracted) for a single entry', () => {
    const FILE_ID = 'src/x.tsx';
    const SOURCE = 'Hello';
    const OLD = 'Hej';
    const NEW = 'NyttHej';

    for (const beforeState of ENTRY_STATES) {
      for (const afterState of ENTRY_STATES) {
        for (const extractedState of EXTRACTED_STATES) {
          const before = buildEntry(beforeState, FILE_ID, SOURCE, OLD);
          const after = buildEntry(afterState, FILE_ID, SOURCE, NEW);
          const extractedSources = buildExtracted(
            extractedState,
            FILE_ID,
            SOURCE,
          );
          writeFileSync(path, JSON.stringify(before));
          const beforeOnDisk = readFileSync(path, 'utf8');
          const shouldThrow =
            beforeState === 'translated' &&
            extractedState === 'has-source' &&
            afterState !== 'translated';
          const label = `before=${beforeState} after=${afterState} extracted=${extractedState}`;
          const input = {
            after,
            extractedSources,
            filePath: path,
          };

          if (shouldThrow) {
            expect(() => writeLocaleFile(input), label).toThrow(
              YapyakInvariantError,
            );
            expect(readFileSync(path, 'utf8'), label).toBe(beforeOnDisk);
          } else {
            writeLocaleFile(input);
            expect(JSON.parse(readFileSync(path, 'utf8')), label).toEqual(
              after,
            );
          }
        }
      }
    }
  });

  it('is idempotent on successful writes', () => {
    const data: LocaleFile = { 'src/a.tsx': { Hello: 'Hej' } };
    writeFileSync(path, JSON.stringify(data));
    const input = {
      after: data,
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: path,
    };

    writeLocaleFile(input);
    const first = readFileSync(path, 'utf8');
    writeLocaleFile(input);
    const second = readFileSync(path, 'utf8');

    expect(second).toBe(first);
  });
});

type EntryState = 'missing' | 'empty' | 'translated';
type ExtractedState = 'has-source' | 'missing-source' | 'no-file';

const ENTRY_STATES: EntryState[] = ['missing', 'empty', 'translated'];
const EXTRACTED_STATES: ExtractedState[] = [
  'has-source',
  'missing-source',
  'no-file',
];

function buildEntry(
  state: EntryState,
  fileId: string,
  source: string,
  value: string,
): LocaleFile {
  if (state === 'missing') {
    return {};
  }
  if (state === 'empty') {
    return { [fileId]: { [source]: '' } };
  }
  return { [fileId]: { [source]: value } };
}

function buildExtracted(
  state: ExtractedState,
  fileId: string,
  source: string,
): Record<string, Set<string>> {
  if (state === 'no-file') {
    return {};
  }
  if (state === 'missing-source') {
    return { [fileId]: new Set(['other']) };
  }
  return { [fileId]: new Set([source]) };
}
