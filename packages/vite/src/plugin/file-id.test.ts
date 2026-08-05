import { describe, expect, it } from 'vitest';

import { toFileId } from './file-id';

describe('toFileId', () => {
  it('builds the fileId from a query-carrying id relative to the project root', () => {
    expect(toFileId('/project', '/project/src/a.tsx?raw')).toBe('src/a.tsx');
  });
});
