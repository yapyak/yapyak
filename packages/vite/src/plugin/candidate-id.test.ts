import { describe, expect, it } from 'vitest';

import { isCandidateId } from './candidate-id';

describe('isCandidateId', () => {
  it('returns true when the filter accepts the fileId', () => {
    expect(
      isCandidateId(
        '/project/src/a.tsx',
        (fileId) => fileId === 'src/a.tsx',
        '/project',
      ),
    ).toBe(true);
  });

  it('returns false for a `\\0`-prefixed id', () => {
    expect(isCandidateId('\0virtual:yapyak', () => true, '/project')).toBe(
      false,
    );
  });
});
