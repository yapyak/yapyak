import type { Fragment } from '../../processor';

import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../processor';
import { remapOffset } from './offset';

function buildFragment(code: string, sourceOffset: number): Fragment {
  return {
    code,
    language: 'ts',
    segments: segmentsFromOffset(code, sourceOffset),
    type: 'script',
  };
}

describe('remapOffset', () => {
  it('returns the source offset for offset zero', () => {
    expect(remapOffset(0, buildFragment('Save changes', 42))).toBe(42);
  });

  it('returns the source offset inside the segment', () => {
    expect(remapOffset(3, buildFragment('Save changes', 42))).toBe(45);
  });

  it('returns the source offset from the segment holding the offset', () => {
    const fragment: Fragment = {
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
    const walked = Array.from(
      {
        length: fragment.code.length + 1,
      },
      (_element, offset) => remapOffset(offset, fragment),
    );

    expect(walked).toEqual([
      0,
      1,
      6,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it('throws when the offset is past the code', () => {
    expect(() => remapOffset(13, buildFragment('Save changes', 42))).toThrow(
      /outside the fragment code/,
    );
  });
});
