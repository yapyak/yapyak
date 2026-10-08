import type { Fragment } from '../../processor';

import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../processor';
import { collectLineStarts, remapPosition, toPosition } from './position';

const fragment: Fragment = {
  code: '',
  language: 'ts',
  scope: 'module',
  segments: segmentsFromOffset('', 0),
  type: 'script',
};

describe('collectLineStarts', () => {
  it('lists the start of every line after LF, CRLF, and CR', () => {
    expect(collectLineStarts('Hello\nWorld\r\nSave\rCancel')).toEqual([
      0,
      6,
      13,
      18,
    ]);
  });

  it('lists only the first line for an empty text', () => {
    expect(collectLineStarts('')).toEqual([
      0,
    ]);
  });
});

describe('remapPosition', () => {
  it('returns the position unchanged when the fragment starts at offset zero', () => {
    const position = {
      column: 1,
      line: 1,
      offset: 0,
    };
    expect(
      remapPosition(position, fragment, collectLineStarts('Hello')),
    ).toEqual(position);
  });

  it('returns a position remapped into the original source when offset is non-zero', () => {
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
      collectLineStarts('Hello\nWorld'),
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
      remapPosition(
        {
          column: 3,
          line: 1,
          offset: 3,
        },
        gapped,
        collectLineStarts("a&amp;&amp;t('Save')"),
      ),
    ).toEqual({
      column: 12,
      line: 1,
      offset: 11,
    });
  });

  it('throws when the line starts are empty', () => {
    expect(() =>
      remapPosition(
        {
          column: 1,
          line: 1,
          offset: 0,
        },
        {
          ...fragment,
          segments: segmentsFromOffset('', 6),
        },
        [],
      ),
    ).toThrow(/has no line start/);
  });
});

describe('toPosition', () => {
  it('builds a 1-based position from an offset at the start of the source', () => {
    expect(toPosition(collectLineStarts('Hello'), 0)).toEqual({
      column: 1,
      line: 1,
      offset: 0,
    });
  });

  it('builds a 1-based position from an offset on a later line', () => {
    expect(toPosition(collectLineStarts('Hello\nWorld'), 8)).toEqual({
      column: 3,
      line: 2,
      offset: 8,
    });
  });

  it('throws when the line starts are empty', () => {
    expect(() => toPosition([], 0)).toThrow(/has no line start/);
  });
});
