import type { ExtractedMessage, Location } from '../parser/file/extract';

import { describe, expect, it } from 'vitest';

import { detectAtIssues } from './disambiguation';

function makeLocation(fileId = 'src/a.tsx', context?: string): Location {
  const location: Location = {
    callSiteContext: {},
    fileId,
    range: {
      end: { column: 0, line: 1, offset: 0 },
      start: { column: 0, line: 1, offset: 0 },
    },
  };
  if (context !== undefined) {
    location.context = context;
  }
  return location;
}

function makeMessage(
  source: string,
  locations: Location[],
  context?: string,
): ExtractedMessage {
  const message: ExtractedMessage = {
    id: context === undefined ? source : `${source}@${context}`,
    locations,
    placeholders: [],
    source,
  };
  if (context !== undefined) {
    message.context = context;
  }
  return message;
}

describe('detectAtIssues', () => {
  it('returns no diagnostics for a single untagged call', () => {
    const messages = [makeMessage('Save', [makeLocation('src/a.tsx')])];
    expect(detectAtIssues(messages)).toHaveLength(0);
  });

  it('returns no diagnostics for two untagged calls of the same source', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx'),
        makeLocation('src/a.tsx'),
      ]),
    ];
    expect(detectAtIssues(messages)).toHaveLength(0);
  });

  it('returns no diagnostics when two contexts disambiguate the same source', () => {
    const messages = [
      makeMessage('Save', [makeLocation('src/a.tsx', 'button')], 'button'),
      makeMessage('Save', [makeLocation('src/a.tsx', 'status')], 'status'),
    ];
    expect(detectAtIssues(messages)).toHaveLength(0);
  });

  it('emits YPK403 when a source is used with both `t()` and `t.as()` in the same file', () => {
    const messages = [
      makeMessage('Save', [makeLocation('src/a.tsx')]),
      makeMessage('Save', [makeLocation('src/a.tsx', 'button')], 'button'),
    ];
    const diagnostics = detectAtIssues(messages);
    expect(diagnostics.some((d) => d.code === 'YPK403')).toBe(true);
  });

  it('emits no YPK403 when t() and t.as() are used in different files', () => {
    const messages = [
      makeMessage('Save', [makeLocation('src/a.tsx')]),
      makeMessage('Save', [makeLocation('src/b.tsx', 'button')], 'button'),
      makeMessage('Save', [makeLocation('src/b.tsx', 'status')], 'status'),
    ];
    const diagnostics = detectAtIssues(messages);
    expect(diagnostics.some((d) => d.code === 'YPK403')).toBe(false);
  });

  it('emits YPK404 when only one `t.as()` exists for a source with no other context', () => {
    const messages = [
      makeMessage('Save', [makeLocation('src/a.tsx', 'button')], 'button'),
    ];
    const diagnostics = detectAtIssues(messages);
    const ypk404 = diagnostics.filter((d) => d.code === 'YPK404');
    expect(ypk404).toHaveLength(1);
    expect(ypk404[0]?.severity).toBe('warning');
  });
});
