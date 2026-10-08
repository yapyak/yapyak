import type { Fragment } from '../../processor';

import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../processor';
import { collectLineStarts } from './position';
import { remapRange, toRange } from './range';
import { parseSourceFile } from './source-file';

const fragment: Fragment = {
  code: 'Hello',
  language: 'ts',
  scope: 'module',
  segments: segmentsFromOffset('Hello', 0),
  type: 'script',
};

describe('remapRange', () => {
  it('returns the range unchanged when the fragment starts at offset zero', () => {
    const range = {
      end: {
        column: 5,
        line: 1,
        offset: 4,
      },
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
    };
    expect(remapRange(range, fragment, collectLineStarts('Hello'))).toEqual(
      range,
    );
  });

  it('builds a range with both endpoints remapped when offset is non-zero', () => {
    const result = remapRange(
      {
        end: {
          column: 6,
          line: 1,
          offset: 5,
        },
        start: {
          column: 1,
          line: 1,
          offset: 0,
        },
      },
      {
        ...fragment,
        code: 'World',
        segments: segmentsFromOffset('World', 6),
      },
      collectLineStarts('Hello\nWorld'),
    );
    expect(result).toEqual({
      end: {
        column: 6,
        line: 2,
        offset: 11,
      },
      start: {
        column: 1,
        line: 2,
        offset: 6,
      },
    });
  });

  it('maps a start and an end anchor across the same gapped segments', () => {
    const gapped: Fragment = {
      code: "a&&t('Save')",
      language: 'ts',
      scope: 'instance',
      segments: [
        {
          codeLength: 1,
          sourceOffset: 0,
        },
        {
          codeLength: 1,
          sourceOffset: 1,
        },
        {
          codeLength: 1,
          sourceOffset: 6,
        },
        {
          codeLength: 9,
          sourceOffset: 11,
        },
      ],
      type: 'template-expression',
    };

    expect(
      remapRange(
        {
          end: {
            column: 13,
            line: 1,
            offset: 12,
          },
          start: {
            column: 4,
            line: 1,
            offset: 3,
          },
        },
        gapped,
        collectLineStarts("a&amp;&amp;t('Save')"),
      ),
    ).toEqual({
      end: {
        column: 21,
        line: 1,
        offset: 20,
      },
      start: {
        column: 12,
        line: 1,
        offset: 11,
      },
    });
  });

  it('throws when the line starts are empty', () => {
    expect(() =>
      remapRange(
        {
          end: {
            column: 6,
            line: 1,
            offset: 5,
          },
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
        },
        {
          ...fragment,
          segments: segmentsFromOffset('Hello', 6),
        },
        [],
      ),
    ).toThrow(/has no line start/);
  });
});

describe('toRange', () => {
  it('builds a range from a node start and end positions', () => {
    const sourceFile = parseSourceFile('src/a.ts', {
      code: 'export const x = 1;',
      language: 'ts',
      type: 'script',
    });
    const [statement] = sourceFile.program.body;
    if (statement === undefined) {
      throw new Error('test setup expects at least one statement');
    }

    expect(toRange(statement, sourceFile)).toEqual({
      end: {
        column: 20,
        line: 1,
        offset: 19,
      },
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
    });
  });
});
