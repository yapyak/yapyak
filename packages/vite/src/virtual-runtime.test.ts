import { describe, expect, it } from 'vitest';

import { isRuntimeExternal } from './virtual-runtime';

describe('isRuntimeExternal', () => {
  it('returns true for an id matching a `RUNTIME_NO_EXTERNAL` pattern', () => {
    expect(isRuntimeExternal('@yapyak/react')).toBe(true);
  });

  it('returns false for an id matching no `RUNTIME_NO_EXTERNAL` pattern', () => {
    expect(isRuntimeExternal('react')).toBe(false);
  });
});
