import { describe, expect, it } from 'vitest';

import { tokenizeDiff } from './diff';

describe('tokenizeDiff', () => {
  it('returns a `diff-add` token for a line starting with `+`', () => {
    expect(tokenizeDiff('+Hello').map((token) => token.kind)).toEqual([
      'diff-add',
    ]);
  });

  it('returns a `diff-remove` token for a line starting with `-`', () => {
    expect(tokenizeDiff('-Hello').map((token) => token.kind)).toEqual([
      'diff-remove',
    ]);
  });

  it('returns a `diff-hunk` token for a line starting with `@@`', () => {
    expect(tokenizeDiff('@@ -1,3 +1,3 @@').map((token) => token.kind)).toEqual([
      'diff-hunk',
    ]);
  });

  it('returns a `plain` token for a line starting with `+++`', () => {
    expect(tokenizeDiff('+++ a/file').map((token) => token.kind)).toEqual([
      'plain',
    ]);
  });

  it('returns a `plain` token for a line starting with `---`', () => {
    expect(tokenizeDiff('--- a/file').map((token) => token.kind)).toEqual([
      'plain',
    ]);
  });
});
