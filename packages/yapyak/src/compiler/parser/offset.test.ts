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
      code: 'SaveCancel',
      language: 'ts',
      segments: [
        {
          codeLength: 4,
          sourceOffset: 10,
        },
        {
          codeLength: 6,
          sourceOffset: 100,
        },
      ],
      type: 'script',
    };

    expect(remapOffset(6, fragment)).toBe(102);
  });

  it('throws when the offset is past the code', () => {
    expect(() => remapOffset(13, buildFragment('Save changes', 42))).toThrow(
      /outside the fragment code/,
    );
  });
});
