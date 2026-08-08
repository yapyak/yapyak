import ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';

import { getScriptKind } from './script-kind';

describe('getScriptKind', () => {
  it('returns `TSX` for a `.tsx` fileId', () => {
    expect(getScriptKind('src/a.tsx', 'ts')).toBe(ts.ScriptKind.TSX);
  });

  it('returns `JSX` for a `.jsx` fileId', () => {
    expect(getScriptKind('src/a.jsx', 'ts')).toBe(ts.ScriptKind.JSX);
  });

  it('returns `TSX` when the fragment language is `tsx`', () => {
    expect(getScriptKind('src/a.astro', 'tsx')).toBe(ts.ScriptKind.TSX);
  });

  it('returns `JS` when the fragment language is `js`', () => {
    expect(getScriptKind('src/a.ts', 'js')).toBe(ts.ScriptKind.JS);
  });

  it('returns `TS` for a plain `.ts` fileId with a `ts` fragment language', () => {
    expect(getScriptKind('src/a.ts', 'ts')).toBe(ts.ScriptKind.TS);
  });
});
