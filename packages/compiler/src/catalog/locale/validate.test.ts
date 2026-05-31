import type { ExtractedMessage, Location } from '../../parser/file/extract';
import type { LocaleFile } from './file';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  validateIcuPairs,
  validateLengths,
  validateLocaleFile,
} from './validate';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function emptyRange() {
  return {
    end: { column: 0, line: 1, offset: 0 },
    start: { column: 0, line: 1, offset: 0 },
  };
}

function makeLocation(args: {
  fileId?: string;
  maxLength?: number;
  tag?: string;
}): Location {
  const location: Location = {
    callSiteContext: {},
    fileId: args.fileId ?? 'src/a.tsx',
    range: emptyRange(),
  };
  if (args.maxLength !== undefined) {
    location.maxLength = args.maxLength;
  }
  if (args.tag !== undefined) {
    location.tag = args.tag;
  }
  return location;
}

function makeMessage(source: string, locations: Location[]): ExtractedMessage {
  return { id: source, locations, placeholders: [], source };
}

describe('validateLocaleFile', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yapyak-validate-'));
    path = join(dir, 'sv.json');
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('returns no diagnostics for a missing file', () => {
    expect(validateLocaleFile({ fileId: 'sv.json', path })).toHaveLength(0);
  });

  it('returns no diagnostics for a well-formed file', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));
    expect(validateLocaleFile({ fileId: 'sv.json', path })).toHaveLength(0);
  });

  it('returns no diagnostics for an object-form entry with string tag values', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': { Open: { action: 'Öppna', status: 'Öppet' } },
      }),
    );
    expect(validateLocaleFile({ fileId: 'sv.json', path })).toHaveLength(0);
  });

  it('emits YPK301 when entry value is a number', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 42 } }));
    const diagnostics = validateLocaleFile({ fileId: 'sv.json', path });
    expect(diagnostics.some((d) => d.code === 'YPK301')).toBe(true);
  });

  it('emits YPK301 when an object entry contains a non-string value', () => {
    writeFileSync(
      path,
      JSON.stringify({ 'src/a.tsx': { Open: { action: 42 } } }),
    );
    const diagnostics = validateLocaleFile({ fileId: 'sv.json', path });
    expect(diagnostics.some((d) => d.code === 'YPK301')).toBe(true);
  });

  it('emits YPK302 for an absolute file-path key', () => {
    writeFileSync(path, JSON.stringify({ '/etc/passwd': { x: 'y' } }));
    const diagnostics = validateLocaleFile({ fileId: 'sv.json', path });
    expect(diagnostics.some((d) => d.code === 'YPK302')).toBe(true);
  });

  it('emits YPK302 for a file-path key with `..`', () => {
    writeFileSync(path, JSON.stringify({ '../etc/passwd': { x: 'y' } }));
    const diagnostics = validateLocaleFile({ fileId: 'sv.json', path });
    expect(diagnostics.some((d) => d.code === 'YPK302')).toBe(true);
  });

  it('emits YPK302 for a file-path key with backslashes', () => {
    writeFileSync(path, JSON.stringify({ 'src\\a.tsx': { x: 'y' } }));
    const diagnostics = validateLocaleFile({ fileId: 'sv.json', path });
    expect(diagnostics.some((d) => d.code === 'YPK302')).toBe(true);
  });

  it('emits YPK303 when a translation string is not Unicode NFC', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Ä' } }));
    const diagnostics = validateLocaleFile({ fileId: 'sv.json', path });
    expect(diagnostics.some((d) => d.code === 'YPK303')).toBe(true);
  });

  it('emits YPK303 when an object entry has a tag value that is not NFC', () => {
    writeFileSync(
      path,
      JSON.stringify({ 'src/a.tsx': { Open: { action: 'Ä' } } }),
    );
    const diagnostics = validateLocaleFile({ fileId: 'sv.json', path });
    expect(diagnostics.some((d) => d.code === 'YPK303')).toBe(true);
  });
});

describe('validateLengths', () => {
  it('returns no diagnostics when no location carries maxLength', () => {
    const messages = [makeMessage('Save', [makeLocation({})])];
    const localeFile: LocaleFile = {};
    expect(
      validateLengths({ fileId: 'sv.json', localeFile, messages }),
    ).toHaveLength(0);
  });

  it('returns no diagnostics when source and target are within maxLength', () => {
    const messages = [makeMessage('Save', [makeLocation({ maxLength: 20 })])];
    const localeFile: LocaleFile = { 'src/a.tsx': { Save: 'Spara' } };
    expect(
      validateLengths({ fileId: 'sv.json', localeFile, messages }),
    ).toHaveLength(0);
  });

  it('emits YPK501 when the translation exceeds maxLength', () => {
    const messages = [makeMessage('Save', [makeLocation({ maxLength: 4 })])];
    const localeFile: LocaleFile = { 'src/a.tsx': { Save: 'Spara nu' } };
    const diagnostics = validateLengths({
      fileId: 'sv.json',
      localeFile,
      messages,
    });
    expect(diagnostics.some((d) => d.code === 'YPK501')).toBe(true);
  });

  it('emits YPK502 when the source exceeds maxLength', () => {
    const messages = [
      makeMessage('Very long source', [makeLocation({ maxLength: 4 })]),
    ];
    const localeFile: LocaleFile = {};
    const diagnostics = validateLengths({
      fileId: 'sv.json',
      localeFile,
      messages,
    });
    expect(diagnostics.some((d) => d.code === 'YPK502')).toBe(true);
  });

  it('reads the tagged target when location carries a tag', () => {
    const messages = [
      makeMessage('Open', [makeLocation({ maxLength: 4, tag: 'action' })]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': { Open: { action: 'Öppna nu' } },
    };
    const diagnostics = validateLengths({
      fileId: 'sv.json',
      localeFile,
      messages,
    });
    expect(diagnostics.some((d) => d.code === 'YPK501')).toBe(true);
  });
});

describe('validateIcuPairs', () => {
  it('returns no diagnostics when source and target have matching placeholders', () => {
    const messages = [makeMessage('Hi {name}', [makeLocation({})])];
    const localeFile: LocaleFile = {
      'src/a.tsx': { 'Hi {name}': 'Hej {name}' },
    };
    expect(
      validateIcuPairs({ fileId: 'sv.json', localeFile, messages }),
    ).toHaveLength(0);
  });

  it('returns no diagnostics when target is empty', () => {
    const messages = [makeMessage('Hi {name}', [makeLocation({})])];
    const localeFile: LocaleFile = { 'src/a.tsx': { 'Hi {name}': '' } };
    expect(
      validateIcuPairs({ fileId: 'sv.json', localeFile, messages }),
    ).toHaveLength(0);
  });

  it('emits YPK205 when a placeholder is missing from the translation', () => {
    const messages = [makeMessage('Hi {name}', [makeLocation({})])];
    const localeFile: LocaleFile = {
      'src/a.tsx': { 'Hi {name}': 'Hej där' },
    };
    const diagnostics = validateIcuPairs({
      fileId: 'sv.json',
      localeFile,
      messages,
    });
    expect(diagnostics.some((d) => d.code === 'YPK205')).toBe(true);
  });

  it('emits YPK206 when the translation has an extra placeholder', () => {
    const messages = [makeMessage('Hello', [makeLocation({})])];
    const localeFile: LocaleFile = {
      'src/a.tsx': { Hello: 'Hej {name}' },
    };
    const diagnostics = validateIcuPairs({
      fileId: 'sv.json',
      localeFile,
      messages,
    });
    expect(diagnostics.some((d) => d.code === 'YPK206')).toBe(true);
  });

  it('emits YPK204 when a placeholder kind differs between source and target', () => {
    const messages = [
      makeMessage('{count, plural, one {# item} other {# items}}', [
        makeLocation({}),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        '{count, plural, one {# item} other {# items}}':
          '{count, select, one {# sak} other {# saker}}',
      },
    };
    const diagnostics = validateIcuPairs({
      fileId: 'sv.json',
      localeFile,
      messages,
    });
    expect(diagnostics.some((d) => d.code === 'YPK204')).toBe(true);
  });

  it('reads the tagged target when location carries a tag', () => {
    const messages = [
      makeMessage('Hi {name}', [makeLocation({ tag: 'greeting' })]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': { 'Hi {name}': { greeting: 'Hej där' } },
    };
    const diagnostics = validateIcuPairs({
      fileId: 'sv.json',
      localeFile,
      messages,
    });
    expect(diagnostics.some((d) => d.code === 'YPK205')).toBe(true);
  });
});
