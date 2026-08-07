import type { Fragment } from '../../processor';

import ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../processor';
import { remapPosition, toPosition } from './position';

function makeSourceFile(source: string): ts.SourceFile {
  return ts.createSourceFile('test.ts', source, ts.ScriptTarget.ESNext, true);
}

const fragment: Fragment = {
  code: '',
  language: 'ts',
  segments: segmentsFromOffset('', 0),
  type: 'script',
};

describe('remapPosition', () => {
  it('returns the position unchanged when the fragment starts at offset zero', () => {
    const position = {
      column: 1,
      line: 1,
      offset: 0,
    };
    expect(remapPosition(position, fragment, 'source')).toEqual(position);
  });

  it('returns a position remapped into the original source when offset is non-zero', () => {
    const original = 'first\nsecond';
    const result = remapPosition(
      {
        column: 1,
        line: 1,
        offset: 0,
      },
      {
        ...fragment,
        segments: segmentsFromOffset('', 6),
      },
      original,
    );
    expect(result).toEqual({
      column: 1,
      line: 2,
      offset: 6,
    });
  });

  it('returns the position from the segment holding the offset', () => {
    const gapped: Fragment = {
      code: "a&&t('Save')",
      language: 'ts',
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
      remapPosition(
        {
          column: 3,
          line: 1,
          offset: 3,
        },
        gapped,
        "a&amp;&amp;t('Save')",
      ),
    ).toEqual({
      column: 12,
      line: 1,
      offset: 11,
    });
  });
});

describe('toPosition', () => {
  it('builds a 1-based position from an offset at the start of the source', () => {
    expect(toPosition(makeSourceFile('hello'), 0)).toEqual({
      column: 1,
      line: 1,
      offset: 0,
    });
  });

  it('builds a 1-based position from an offset on a later line', () => {
    expect(toPosition(makeSourceFile('hello\nworld'), 6)).toEqual({
      column: 1,
      line: 2,
      offset: 6,
    });
  });
});
