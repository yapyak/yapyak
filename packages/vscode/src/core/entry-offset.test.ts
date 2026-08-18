import { describe, expect, it } from 'vitest';

import { resolveEntryOffset } from './entry-offset';

const TEXT = `{
  "src/a.tsx": {
    "Save changes": "Spara ändringar"
  }
}
`;

describe('resolveEntryOffset', () => {
  it('returns the entry offset', () => {
    expect(resolveEntryOffset(TEXT, 'src/a.tsx', 'Save changes')).toBe(
      TEXT.indexOf('"Save changes"'),
    );
  });

  it('returns the section offset when the entry is missing', () => {
    expect(resolveEntryOffset(TEXT, 'src/a.tsx', 'Cancel')).toBe(
      TEXT.indexOf('"src/a.tsx"'),
    );
  });

  it('returns 0 when the section is missing', () => {
    expect(resolveEntryOffset(TEXT, 'src/b.tsx', 'Save changes')).toBe(0);
  });
});
