import type { ExtractedMessage, Location } from '../parser';

import { describe, expect, it } from 'vitest';

import { toMessageKey } from '../parser';
import { findContextDiagnostics } from './context-diagnostic';

function makeLocation(fileId = 'src/a.tsx', context?: string): Location {
  const location: Location = {
    callSiteContext: {},
    fileId,
    range: {
      end: {
        column: 0,
        line: 1,
        offset: 0,
      },
      start: {
        column: 0,
        line: 1,
        offset: 0,
      },
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
    id: toMessageKey(source, context),
    locations,
    placeholders: [],
    source,
  };
  if (context !== undefined) {
    message.context = context;
  }
  return message;
}

describe('findContextDiagnostics', () => {
  it('returns no diagnostics for a single untagged call', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx'),
      ]),
    ];
    expect(findContextDiagnostics(messages)).toHaveLength(0);
  });

  it('returns no diagnostics for two untagged calls of the same source', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx'),
        makeLocation('src/a.tsx'),
      ]),
    ];
    expect(findContextDiagnostics(messages)).toHaveLength(0);
  });

  it('returns no diagnostics when two contexts disambiguate the same source', () => {
    const messages = [
      makeMessage(
        'Save',
        [
          makeLocation('src/a.tsx', 'button'),
        ],
        'button',
      ),
      makeMessage(
        'Save',
        [
          makeLocation('src/a.tsx', 'status'),
        ],
        'status',
      ),
    ];
    expect(findContextDiagnostics(messages)).toHaveLength(0);
  });

  it('emits YAP0018 when a source is used with both `t()` and `t.as()` in the same file', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx'),
      ]),
      makeMessage(
        'Save',
        [
          makeLocation('src/a.tsx', 'button'),
        ],
        'button',
      ),
    ];
    const diagnostics = findContextDiagnostics(messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0018'),
    ).toBe(true);
  });

  it('emits no YAP0018 when t() and t.as() are used in different files', () => {
    const messages = [
      makeMessage('Save', [
        makeLocation('src/a.tsx'),
      ]),
      makeMessage(
        'Save',
        [
          makeLocation('src/b.tsx', 'button'),
        ],
        'button',
      ),
      makeMessage(
        'Save',
        [
          makeLocation('src/b.tsx', 'status'),
        ],
        'status',
      ),
    ];
    const diagnostics = findContextDiagnostics(messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0018'),
    ).toBe(false);
  });

  it('emits YAP0019 when only one `t.as()` exists for a source with no other context', () => {
    const messages = [
      makeMessage(
        'Save',
        [
          makeLocation('src/a.tsx', 'button'),
        ],
        'button',
      ),
    ];
    const diagnostics = findContextDiagnostics(messages);
    const ypk404 = diagnostics.filter(
      (diagnostic) => diagnostic.code === 'YAP0019',
    );
    expect(ypk404).toHaveLength(1);
    expect(ypk404[0]?.severity).toBe('warning');
  });
});
