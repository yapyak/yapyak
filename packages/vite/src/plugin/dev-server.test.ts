import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  areEntriesEqual,
  extractChangedFileIds,
  readLocaleFile,
} from './dev-server';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('areEntriesEqual', () => {
  it('returns true when both records hold identical entries', () => {
    expect(
      areEntriesEqual(
        {
          Hello: 'Hej',
        },
        {
          Hello: 'Hej',
        },
      ),
    ).toBe(true);
  });

  it('returns true for two empty records', () => {
    expect(areEntriesEqual({}, {})).toBe(true);
  });

  it('returns false when a key is missing in the second record', () => {
    expect(
      areEntriesEqual(
        {
          Hello: 'Hej',
          World: 'Världen',
        },
        {
          Hello: 'Hej',
        },
      ),
    ).toBe(false);
  });

  it('returns false when a value differs', () => {
    expect(
      areEntriesEqual(
        {
          Hello: 'Hej',
        },
        {
          Hello: 'Hejsan',
        },
      ),
    ).toBe(false);
  });

  it('returns false when the second record is `undefined`', () => {
    expect(
      areEntriesEqual(
        {
          Hello: 'Hej',
        },
        undefined,
      ),
    ).toBe(false);
  });
});

describe('extractChangedFileIds', () => {
  it('returns an empty set when before and after match', () => {
    const file = {
      'src/a.ts': {
        Hello: 'Hej',
      },
    };
    expect(extractChangedFileIds(file, file)).toEqual(new Set());
  });

  it('extracts the file id when entries differ for that file', () => {
    expect(
      extractChangedFileIds(
        {
          'src/a.ts': {
            Hello: 'Hej',
          },
        },
        {
          'src/a.ts': {
            Hello: 'Hejsan',
          },
        },
      ),
    ).toEqual(
      new Set([
        'src/a.ts',
      ]),
    );
  });

  it('extracts a file id present only in after', () => {
    expect(
      extractChangedFileIds(
        {},
        {
          'src/a.ts': {
            Hello: 'Hej',
          },
        },
      ),
    ).toEqual(
      new Set([
        'src/a.ts',
      ]),
    );
  });

  it('extracts a file id present only in before', () => {
    expect(
      extractChangedFileIds(
        {
          'src/a.ts': {
            Hello: 'Hej',
          },
        },
        {},
      ),
    ).toEqual(
      new Set([
        'src/a.ts',
      ]),
    );
  });

  it('extracts every changed file id when multiple files differ', () => {
    expect(
      extractChangedFileIds(
        {
          'src/a.ts': {
            Hello: 'Hej',
          },
          'src/b.ts': {
            World: 'Världen',
          },
        },
        {
          'src/a.ts': {
            Hello: 'Hejsan',
          },
          'src/b.ts': {
            World: 'Världen',
          },
          'src/c.ts': {
            Save: 'Spara',
          },
        },
      ),
    ).toEqual(
      new Set([
        'src/a.ts',
        'src/c.ts',
      ]),
    );
  });
});

describe('readLocaleFile', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'yapyak-vite-dev-server-'));
  });

  afterEach(() => {
    rmSync(directory, {
      force: true,
      recursive: true,
    });
  });

  it('reads and parses a locale file', () => {
    const path = join(directory, 'sv.json');
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.ts': {
          Hello: 'Hej',
        },
      }),
    );
    expect(readLocaleFile(path)).toEqual({
      'src/a.ts': {
        Hello: 'Hej',
      },
    });
  });

  it('returns an empty object when the file does not exist', () => {
    expect(readLocaleFile(join(directory, 'missing.json'))).toEqual({});
  });

  it('returns an empty object for invalid JSON', () => {
    const path = join(directory, 'sv.json');
    writeFileSync(path, '{ not valid');
    expect(readLocaleFile(path)).toEqual({});
  });

  it('returns an empty object when the parsed value is not an object', () => {
    const path = join(directory, 'sv.json');
    writeFileSync(path, '["array", "not", "object"]');
    expect(readLocaleFile(path)).toEqual({});
  });
});
