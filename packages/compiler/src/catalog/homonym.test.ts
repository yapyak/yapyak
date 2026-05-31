import type { ExtractedMessage, Location } from '../parser/file/extract';

import { describe, expect, it } from 'vitest';

import { detectHomonyms } from './homonym';

function makeLocation(
  fileId: string,
  options: { hint?: string; maxLength?: number; tag?: string } = {},
): Location {
  const location: Location = {
    callSiteContext: {} as never,
    fileId,
    range: {
      end: { column: 0, line: 1, offset: 0 },
      start: { column: 0, line: 1, offset: 0 },
    },
  };
  if (options.tag !== undefined) {
    location.tag = options.tag;
  }
  if (options.hint !== undefined) {
    location.hint = options.hint;
  }
  if (options.maxLength !== undefined) {
    location.maxLength = options.maxLength;
  }
  return location;
}

function makeMessage(source: string, locations: Location[]): ExtractedMessage {
  return {
    id: source,
    locations,
    placeholders: [],
    source,
  };
}

describe('detectHomonyms', () => {
  it('returns no diagnostics for a singleton untagged call', () => {
    const messages = [makeMessage('Save', [makeLocation('src/a.tsx')])];
    expect(detectHomonyms(messages)).toHaveLength(0);
  });

  it('returns no diagnostics for a singleton tagged call', () => {
    const messages = [
      makeMessage('Save', [makeLocation('src/a.tsx', { tag: 'action' })]),
    ];
    expect(detectHomonyms(messages)).toHaveLength(0);
  });

  it('returns no diagnostics when occurrences are in different files', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx'),
        makeLocation('src/b.tsx'),
      ]),
    ];
    expect(detectHomonyms(messages)).toHaveLength(0);
  });

  it('returns no diagnostics when all occurrences in a file are tagged with distinct tags', () => {
    const messages = [
      makeMessage('Open', [
        makeLocation('src/a.tsx', { tag: 'action' }),
        makeLocation('src/a.tsx', { tag: 'status' }),
      ]),
    ];
    expect(detectHomonyms(messages)).toHaveLength(0);
  });

  it('emits YPK404 when two untagged occurrences share a source in one file', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx'),
        makeLocation('src/a.tsx'),
      ]),
    ];
    const diagnostics = detectHomonyms(messages);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe('YPK404');
  });

  it('emits YPK404 when occurrences are mixed tagged and untagged in one file', () => {
    const messages = [
      makeMessage('Open', [
        makeLocation('src/a.tsx', { tag: 'action' }),
        makeLocation('src/a.tsx'),
      ]),
    ];
    const diagnostics = detectHomonyms(messages);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe('YPK404');
  });

  it('returns no diagnostics when two same-tag occurrences carry no metadata', () => {
    const messages = [
      makeMessage('Open', [
        makeLocation('src/a.tsx', { tag: 'action' }),
        makeLocation('src/a.tsx', { tag: 'action' }),
      ]),
    ];
    expect(detectHomonyms(messages)).toHaveLength(0);
  });

  it('returns no diagnostics when same-tag occurrences carry identical hints', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx', { hint: 'Form submit', tag: 'primary' }),
        makeLocation('src/a.tsx', { hint: 'Form submit', tag: 'primary' }),
      ]),
    ];
    expect(detectHomonyms(messages)).toHaveLength(0);
  });

  it('emits YPK406 when same-tag occurrences carry conflicting hints', () => {
    const messages = [
      makeMessage('Open', [
        makeLocation('src/a.tsx', { hint: 'Primary CTA', tag: 'action' }),
        makeLocation('src/a.tsx', { hint: 'Cancel action', tag: 'action' }),
      ]),
    ];
    const diagnostics = detectHomonyms(messages);
    expect(diagnostics.some((d) => d.code === 'YPK406')).toBe(true);
  });

  it('emits YPK406 when same-tag occurrences carry conflicting maxLength', () => {
    const messages = [
      makeMessage('Open', [
        makeLocation('src/a.tsx', { maxLength: 12, tag: 'action' }),
        makeLocation('src/a.tsx', { maxLength: 20, tag: 'action' }),
      ]),
    ];
    const diagnostics = detectHomonyms(messages);
    expect(diagnostics.some((d) => d.code === 'YPK406')).toBe(true);
  });

  it('treats `.hint()` absent at one site as compatible with the other', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx', { tag: 'primary' }),
        makeLocation('src/a.tsx', { hint: 'Form submit', tag: 'primary' }),
      ]),
    ];
    expect(detectHomonyms(messages)).toHaveLength(0);
  });
});
