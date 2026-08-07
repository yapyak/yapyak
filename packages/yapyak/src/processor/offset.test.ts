import { describe, expect, it } from 'vitest';

import {
  offsetToOriginalPosition,
  rangeFromOffsets,
  segmentsFromOffset,
} from './offset';

describe('offsetToOriginalPosition', () => {
  it('returns the position on line 1 when the offset precedes the first newline', () => {
    expect(offsetToOriginalPosition('Hello\nWorld', 3)).toEqual({
      column: 4,
      line: 1,
      offset: 3,
    });
  });

  it('returns the line and column when the offset follows a newline', () => {
    expect(offsetToOriginalPosition('Hello\nWorld', 8)).toEqual({
      column: 3,
      line: 2,
      offset: 8,
    });
  });

  it('returns line 1 column 1 for offset 0', () => {
    expect(offsetToOriginalPosition('Hello', 0)).toEqual({
      column: 1,
      line: 1,
      offset: 0,
    });
  });

  it('returns line 1 column 1 for an empty source', () => {
    expect(offsetToOriginalPosition('', 0)).toEqual({
      column: 1,
      line: 1,
      offset: 0,
    });
  });
});

describe('rangeFromOffsets', () => {
  it('returns a range spanning the start and end offsets', () => {
    expect(rangeFromOffsets('Hello\nWorld', 0, 8)).toEqual({
      end: {
        column: 3,
        line: 2,
        offset: 8,
      },
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
    });
  });
});

describe('segmentsFromOffset', () => {
  it('builds one segment spanning the whole code', () => {
    expect(segmentsFromOffset('Save changes', 42)).toEqual([
      {
        codeLength: 12,
        sourceOffset: 42,
      },
    ]);
  });

  it('builds one segment anchored at offset zero', () => {
    expect(segmentsFromOffset('Save', 0)).toEqual([
      {
        codeLength: 4,
        sourceOffset: 0,
      },
    ]);
  });

  it('builds a segment of length zero for empty code', () => {
    expect(segmentsFromOffset('', 7)).toEqual([
      {
        codeLength: 0,
        sourceOffset: 7,
      },
    ]);
  });
});
