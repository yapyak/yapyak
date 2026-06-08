import type { OrphanCache, OrphanEntry } from './orphan';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  addOrphan,
  findOrphan,
  getDefaultYapyakDir,
  readOrphans,
  removeOrphan,
  writeOrphans,
} from './orphan';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('addOrphan', () => {
  it('writes a fresh source entry into an empty cache', () => {
    const cache: OrphanCache = {};
    addOrphan(cache, 'src/a.ts', 'Save', {
      deletedAt: '2025-01-01T00:00:00Z',
      translations: { sv: 'Spara' },
    });
    expect(cache).toEqual({
      'src/a.ts': {
        Save: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Spara' },
        },
      },
    });
  });

  it('writes a fresh source entry alongside an existing one', () => {
    const cache: OrphanCache = {
      'src/a.ts': {
        Save: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Spara' },
        },
      },
    };
    addOrphan(cache, 'src/a.ts', 'Cancel', {
      deletedAt: '2025-01-02T00:00:00Z',
      translations: { sv: 'Avbryt' },
    });
    expect(cache['src/a.ts']).toHaveProperty('Save');
    expect(cache['src/a.ts']).toHaveProperty('Cancel');
  });
});

describe('findOrphan', () => {
  it('returns the entry when found directly under the requested fileId', () => {
    const entry: OrphanEntry = {
      deletedAt: '2025-01-01T00:00:00Z',
      translations: { sv: 'Spara' },
    };
    const cache: OrphanCache = { 'src/a.ts': { Save: entry } };
    expect(findOrphan(cache, 'src/a.ts', 'Save')).toEqual({
      entry,
      fileId: 'src/a.ts',
    });
  });

  it('returns the entry from another fileId when the requested fileId lacks it', () => {
    const entry: OrphanEntry = {
      deletedAt: '2025-01-01T00:00:00Z',
      translations: { sv: 'Spara' },
    };
    const cache: OrphanCache = { 'src/b.ts': { Save: entry } };
    expect(findOrphan(cache, 'src/a.ts', 'Save')).toEqual({
      entry,
      fileId: 'src/b.ts',
    });
  });

  it('returns the most recently deleted entry when multiple fileIds match', () => {
    const older: OrphanEntry = {
      deletedAt: '2025-01-01T00:00:00Z',
      translations: { sv: 'Spara' },
    };
    const newer: OrphanEntry = {
      deletedAt: '2025-02-01T00:00:00Z',
      translations: { sv: 'Spara' },
    };
    const cache: OrphanCache = {
      'src/a.ts': { Save: older },
      'src/b.ts': { Save: newer },
    };
    expect(findOrphan(cache, 'src/c.ts', 'Save')).toEqual({
      entry: newer,
      fileId: 'src/b.ts',
    });
  });

  it('returns undefined when no fileId holds the source', () => {
    const cache: OrphanCache = {
      'src/a.ts': {
        Save: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Spara' },
        },
      },
    };
    expect(findOrphan(cache, 'src/a.ts', 'Cancel')).toBeUndefined();
  });
});

describe('getDefaultYapyakDir', () => {
  it('builds a `.yapyak` path under the project root', () => {
    expect(getDefaultYapyakDir('/tmp/project')).toBe('/tmp/project/.yapyak');
  });
});

describe('readOrphans', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yapyak-orphans-'));
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('returns an empty cache when the file is missing', () => {
    expect(readOrphans(dir)).toEqual({});
  });

  it('returns an empty cache when the file is empty', () => {
    writeFileSync(join(dir, 'orphans.json'), '');
    expect(readOrphans(dir)).toEqual({});
  });

  it('returns an empty cache when the file is invalid JSON', () => {
    writeFileSync(join(dir, 'orphans.json'), '{not json');
    expect(readOrphans(dir)).toEqual({});
  });

  it('blocks an entry whose value is not an object', () => {
    writeFileSync(
      join(dir, 'orphans.json'),
      JSON.stringify({ 'src/a.ts': { Save: 'not-an-object' } }),
    );
    expect(readOrphans(dir)).toEqual({});
  });

  it('blocks an entry whose `deletedAt` is not a string', () => {
    writeFileSync(
      join(dir, 'orphans.json'),
      JSON.stringify({
        'src/a.ts': { Save: { deletedAt: 123, translations: { sv: 'Spara' } } },
      }),
    );
    expect(readOrphans(dir)).toEqual({});
  });

  it('blocks an entry whose `translations` is not an object', () => {
    writeFileSync(
      join(dir, 'orphans.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: { deletedAt: '2025-01-01T00:00:00Z', translations: null },
        },
      }),
    );
    expect(readOrphans(dir)).toEqual({});
  });

  it('blocks an entry whose `translations` map is empty after cleaning', () => {
    writeFileSync(
      join(dir, 'orphans.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: {
            deletedAt: '2025-01-01T00:00:00Z',
            translations: { de: 42, sv: '' },
          },
        },
      }),
    );
    expect(readOrphans(dir)).toEqual({});
  });

  it('blocks a fileId whose value is not an object', () => {
    writeFileSync(
      join(dir, 'orphans.json'),
      JSON.stringify({ 'src/a.ts': 'not-an-object' }),
    );
    expect(readOrphans(dir)).toEqual({});
  });

  it('returns the parsed cache when the file holds valid entries', () => {
    const cache: OrphanCache = {
      'src/a.ts': {
        Save: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Spara' },
        },
      },
    };
    writeFileSync(join(dir, 'orphans.json'), JSON.stringify(cache));
    expect(readOrphans(dir)).toEqual(cache);
  });
});

describe('removeOrphan', () => {
  it('returns true and deletes the entry when present', () => {
    const cache: OrphanCache = {
      'src/a.ts': {
        Save: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Spara' },
        },
      },
    };
    expect(removeOrphan(cache, 'src/a.ts', 'Save')).toBe(true);
    expect(cache).toEqual({});
  });

  it('returns false when the fileId is absent', () => {
    const cache: OrphanCache = {};
    expect(removeOrphan(cache, 'src/a.ts', 'Save')).toBe(false);
  });

  it('returns false when the source is absent under the fileId', () => {
    const cache: OrphanCache = {
      'src/a.ts': {
        Cancel: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Avbryt' },
        },
      },
    };
    expect(removeOrphan(cache, 'src/a.ts', 'Save')).toBe(false);
  });

  it('preserves sibling sources when one source is removed', () => {
    const cache: OrphanCache = {
      'src/a.ts': {
        Cancel: {
          deletedAt: '2025-01-02T00:00:00Z',
          translations: { sv: 'Avbryt' },
        },
        Save: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Spara' },
        },
      },
    };
    removeOrphan(cache, 'src/a.ts', 'Save');
    expect(cache['src/a.ts']).toEqual({
      Cancel: {
        deletedAt: '2025-01-02T00:00:00Z',
        translations: { sv: 'Avbryt' },
      },
    });
  });
});

describe('writeOrphans', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yapyak-orphans-'));
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('writes the cache to `orphans.json` in canonical JSON form', () => {
    const cache: OrphanCache = {
      'src/a.ts': {
        Save: {
          deletedAt: '2025-01-01T00:00:00Z',
          translations: { sv: 'Spara' },
        },
      },
    };
    writeOrphans(dir, cache);
    const written = JSON.parse(
      readFileSync(join(dir, 'orphans.json'), 'utf-8'),
    );
    expect(written).toEqual(cache);
  });

  it('creates the parent directory when missing', () => {
    const nested = join(dir, 'nested', 'path');
    writeOrphans(nested, {});
    expect(
      JSON.parse(readFileSync(join(nested, 'orphans.json'), 'utf-8')),
    ).toEqual({});
  });
});
