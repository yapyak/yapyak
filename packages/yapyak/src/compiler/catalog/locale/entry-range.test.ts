import { describe, expect, it } from 'vitest';

import { findEntryRange } from './entry-range';

function sliceRange(content: string, source: string, context?: string): string {
  const range = findEntryRange(content, 'src/a.tsx', source, context);
  if (range === undefined) {
    return '';
  }
  return content.slice(range.start.offset, range.end.offset);
}

describe('findEntryRange', () => {
  it('returns the range of the translation when found', () => {
    const content = JSON.stringify(
      {
        'src/a.tsx': {
          Hello: 'Hej',
          Save: 'Spara',
        },
      },
      null,
      2,
    );

    expect(sliceRange(content, 'Save')).toBe('"Spara"');
  });

  it('returns undefined when the source is not in the file', () => {
    const content = JSON.stringify({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });

    expect(findEntryRange(content, 'src/a.tsx', 'Cancel')).toBeUndefined();
  });

  it('returns undefined when the file is not in the locale file', () => {
    const content = JSON.stringify({
      'src/b.tsx': {
        Hello: 'Hej',
      },
    });

    expect(findEntryRange(content, 'src/a.tsx', 'Hello')).toBeUndefined();
  });

  it('returns the range of the context variant when a context is given', () => {
    const content = JSON.stringify(
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

    expect(sliceRange(content, 'Open', 'button')).toBe('"Öppna"');
  });

  it('returns the range of the key that follows a translation holding the same text', () => {
    const content = JSON.stringify(
      {
        'src/a.tsx': {
          Hello: 'Save',
          Save: 'Spara',
        },
      },
      null,
      2,
    );

    expect(sliceRange(content, 'Save')).toBe('"Spara"');
  });

  it('returns the range of a translation whose key holds a unicode escape', () => {
    const content = '{"src/a.tsx":{"caf\\u00e9":"Spara"}}';

    expect(sliceRange(content, 'café')).toBe('"Spara"');
  });

  it('returns the range of the last entry when the source is repeated', () => {
    const content = '{"src/a.tsx":{"Save":"Spara","Save":"Avbryt"}}';

    expect(sliceRange(content, 'Save')).toBe('"Avbryt"');
  });

  it('returns the range of a translation that follows a context-keyed entry', () => {
    const content = JSON.stringify(
      {
        'src/a.tsx': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
          Save: 'Spara',
        },
      },
      null,
      2,
    );

    expect(sliceRange(content, 'Save')).toBe('"Spara"');
  });
});
