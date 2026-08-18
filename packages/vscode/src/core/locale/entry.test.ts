import { describe, expect, it } from 'vitest';

import {
  collectFileKeys,
  collectLocaleEntries,
  findEntryAt,
  findFileKeyAt,
  resolveDeletionRange,
} from './entry';

const TEXT = `{
  "src/a.tsx": {
    "Save changes": "Spara ändringar",
    "Open": {
      "badge": "Öppen",
      "button": "Öppna"
    }
  },
  "src/b.tsx": {
    "Cancel": "Avbryt"
  }
}
`;

describe('collectFileKeys', () => {
  it('collects no key for an empty file', () => {
    expect(collectFileKeys(collectLocaleEntries('{}'))).toEqual([]);
  });

  it('collects one key for a file holding one entry', () => {
    const text = '{"src/a.tsx":{"Cancel":"Avbryt"}}';

    expect(
      collectFileKeys(collectLocaleEntries(text)).map((key) => key.fileId),
    ).toEqual([
      'src/a.tsx',
    ]);
  });

  it('collects one key for every file holding entries', () => {
    expect(
      collectFileKeys(collectLocaleEntries(TEXT)).map((key) => key.fileId),
    ).toEqual([
      'src/a.tsx',
      'src/b.tsx',
    ]);
  });
});

describe('collectLocaleEntries', () => {
  it('collects an entry for every value', () => {
    expect(
      collectLocaleEntries(TEXT).map((entry) => [
        entry.fileId,
        entry.source,
        entry.context,
        TEXT.slice(entry.offset, entry.offset + entry.length),
      ]),
    ).toEqual([
      [
        'src/a.tsx',
        'Save changes',
        undefined,
        'Spara ändringar',
      ],
      [
        'src/a.tsx',
        'Open',
        'badge',
        'Öppen',
      ],
      [
        'src/a.tsx',
        'Open',
        'button',
        'Öppna',
      ],
      [
        'src/b.tsx',
        'Cancel',
        undefined,
        'Avbryt',
      ],
    ]);
  });

  it('collects an entry holding an escaped quote', () => {
    const text = '{"src/a.tsx": {"Hello": "Det \\"är\\" så"}}';

    expect(
      collectLocaleEntries(text).map((entry) =>
        text.slice(entry.offset, entry.offset + entry.length),
      ),
    ).toEqual([
      'Det \\"är\\" så',
    ]);
  });

  it('collects no entry for an empty file', () => {
    expect(collectLocaleEntries('{}')).toEqual([]);
  });

  it('collects no entry for a value outside a file section', () => {
    expect(collectLocaleEntries('{"Hello": "Hej"}')).toEqual([]);
  });

  it('collects the entries before an unterminated string', () => {
    expect(
      collectLocaleEntries(
        '{"src/a.tsx": {"Cancel": "Avbryt", "Hello": "Hej',
      ).map((entry) => entry.source),
    ).toEqual([
      'Cancel',
    ]);
  });
});

describe('findEntryAt', () => {
  const text = JSON.stringify(
    {
      'src/a.tsx': {
        Cancel: 'Avbryt',
        Hello: 'Hej',
      },
    },
    null,
    2,
  );
  const entries = collectLocaleEntries(text);
  const lineStart = text.indexOf('\n', text.indexOf('"Cancel"') - 20) + 1;
  const lineEnd = text.indexOf('\n', lineStart);

  it('returns the entry when the offset is inside the value', () => {
    expect(
      findEntryAt({
        entries,
        lineEnd,
        lineStart,
        offset: text.indexOf('Avbryt'),
      })?.source,
    ).toBe('Cancel');
  });

  it('returns the entry when the offset is on the indentation', () => {
    expect(
      findEntryAt({
        entries,
        lineEnd,
        lineStart,
        offset: lineStart,
      })?.source,
    ).toBe('Cancel');
  });

  it('returns undefined when the line holds no entry', () => {
    expect(
      findEntryAt({
        entries,
        lineEnd: 1,
        lineStart: 0,
        offset: 0,
      }),
    ).toBeUndefined();
  });
});

describe('findFileKeyAt', () => {
  const entries = collectLocaleEntries(TEXT);

  it('returns the key when found', () => {
    expect(findFileKeyAt(entries, TEXT.indexOf('src/b.tsx'))?.fileId).toBe(
      'src/b.tsx',
    );
  });

  it('returns undefined when not found', () => {
    expect(findFileKeyAt(entries, TEXT.indexOf('Avbryt'))).toBeUndefined();
  });
});

function deleteEntry(text: string, source: string): string {
  const entry = collectLocaleEntries(text).find(
    (candidate) => candidate.source === source,
  );
  if (entry === undefined) {
    return text;
  }
  const range = resolveDeletionRange(text, entry);
  return text.slice(0, range.start) + text.slice(range.end);
}

describe('resolveDeletionRange', () => {
  it('returns a range that leaves valid JSON for the first entry', () => {
    const text = JSON.stringify(
      {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Hello: 'Hej',
        },
      },
      null,
      2,
    );
    const next = deleteEntry(text, 'Cancel');

    expect(JSON.parse(next)).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('returns a range that leaves valid JSON for the last entry', () => {
    const text = JSON.stringify(
      {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Hello: 'Hej',
        },
      },
      null,
      2,
    );
    const next = deleteEntry(text, 'Hello');

    expect(JSON.parse(next)).toEqual({
      'src/a.tsx': {
        Cancel: 'Avbryt',
      },
    });
  });

  it('returns a range that leaves valid JSON for the only entry', () => {
    const text = JSON.stringify(
      {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
      null,
      2,
    );
    const next = deleteEntry(text, 'Hello');

    expect(JSON.parse(next)).toEqual({
      'src/a.tsx': {},
    });
  });

  it('returns a range that leaves valid JSON for a middle entry', () => {
    const text = JSON.stringify(
      {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Hello: 'Hej',
          Save: 'Spara',
        },
      },
      null,
      2,
    );
    const next = deleteEntry(text, 'Hello');

    expect(JSON.parse(next)).toEqual({
      'src/a.tsx': {
        Cancel: 'Avbryt',
        Save: 'Spara',
      },
    });
  });

  it('returns a range that leaves valid JSON for a context variant', () => {
    const text = JSON.stringify(
      {
        'src/a.tsx': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
        },
      },
      null,
      2,
    );
    const entry = collectLocaleEntries(text).find(
      (candidate) => candidate.context === 'badge',
    );
    if (entry === undefined) {
      throw new Error('entry is missing');
    }
    const range = resolveDeletionRange(text, entry);
    const next = text.slice(0, range.start) + text.slice(range.end);

    expect(JSON.parse(next)).toEqual({
      'src/a.tsx': {
        Open: {
          button: 'Öppna',
        },
      },
    });
  });
});
